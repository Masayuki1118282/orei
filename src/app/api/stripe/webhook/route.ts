import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[webhook] checkout.session.completed:", session.id);
        console.log("[webhook] metadata:", JSON.stringify(session.metadata));

        const userId = session.metadata?.supabase_user_id;
        if (!userId) {
          console.error("[webhook] supabase_user_id が metadata に存在しません");
          break;
        }
        console.log("[webhook] userId:", userId);

        // metadataのplan_typeでプランを判別
        const validPlans = ["personal_yearly", "personal_monthly", "light_yearly", "light_monthly"] as const;
        type ValidPlan = typeof validPlans[number];
        const rawPlanType = session.metadata?.plan_type ?? "";
        const planType: ValidPlan = (validPlans as readonly string[]).includes(rawPlanType)
          ? rawPlanType as ValidPlan
          : "personal_monthly";
        console.log("[webhook] planType:", planType);
        console.log("[webhook] subscription id:", session.subscription);

        console.log("[webhook] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING");
        console.log("[webhook] SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "MISSING");

        const { error: updateError } = await serviceClient
          .from("profiles")
          .update({
            plan: planType,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);

        if (updateError) {
          console.error("[webhook] profiles UPDATE 失敗 code:", updateError.code, "message:", updateError.message, "details:", updateError.details);
        } else {
          console.log("[webhook] profiles UPDATE 成功 → plan:", planType);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("[webhook] subscription.updated:", sub.id, "status:", sub.status);
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;

        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
        if (!userId) break;

        // 現在DBに保存されているサブスクリプションIDを確認
        const { data: currentProfile } = await serviceClient
          .from("profiles")
          .select("stripe_subscription_id, plan")
          .eq("id", userId)
          .single();
        console.log("[webhook] subscription.updated: DB current sub_id:", currentProfile?.stripe_subscription_id, "event sub_id:", sub.id);

        const isActive = sub.status === "active" || sub.status === "trialing";
        if (!isActive) {
          // 古いサブスクリプションのキャンセルイベントでplanをfreeに戻さない
          if (currentProfile?.stripe_subscription_id !== sub.id) {
            console.log("[webhook] subscription.updated: 古いサブスクの非activeイベントのため無視");
            break;
          }
          console.log("[webhook] subscription.updated: 現在のサブスクが非active → plan=free");
          await serviceClient
            .from("profiles")
            .update({ plan: "free", stripe_subscription_id: null })
            .eq("id", userId);
          break;
        }

        // PriceIDでプラン判別
        const priceId = sub.items.data[0]?.price?.id;
        const personalYearlyId = process.env.STRIPE_PRICE_ID_PERSONAL_YEARLY;
        const lightMonthlyId = process.env.STRIPE_PRICE_ID_LIGHT;
        const lightYearlyId = process.env.STRIPE_PRICE_ID_LIGHT_YEARLY;

        let updatedPlan = "personal_monthly";
        if (personalYearlyId && priceId === personalYearlyId) updatedPlan = "personal_yearly";
        else if (lightYearlyId && priceId === lightYearlyId) updatedPlan = "light_yearly";
        else if (lightMonthlyId && priceId === lightMonthlyId) updatedPlan = "light_monthly";

        await serviceClient
          .from("profiles")
          .update({ plan: updatedPlan, stripe_subscription_id: sub.id })
          .eq("id", userId);
        console.log("[webhook] subscription.updated: plan →", updatedPlan);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        console.log("[webhook] subscription.deleted:", sub.id);
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;

        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
        if (!userId) break;

        // 現在のサブスクリプションと一致する場合のみfreeに戻す
        const { data: currentProfile } = await serviceClient
          .from("profiles")
          .select("stripe_subscription_id")
          .eq("id", userId)
          .single();

        if (currentProfile?.stripe_subscription_id !== sub.id) {
          console.log("[webhook] subscription.deleted: 古いサブスクのため無視");
          break;
        }

        await serviceClient
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", userId);
        console.log("[webhook] subscription.deleted: plan → free");
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
