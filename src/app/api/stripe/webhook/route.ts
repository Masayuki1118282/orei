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
        const userId = session.metadata?.supabase_user_id;
        if (!userId) break;

        // metadataのplan_typeで月額/年額を判別
        const planType = session.metadata?.plan_type === "personal_yearly"
          ? "personal_yearly"
          : "personal_monthly";

        await serviceClient
          .from("profiles")
          .update({
            plan: planType,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;

        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
        if (!userId) break;

        const isActive = sub.status === "active" || sub.status === "trialing";
        if (!isActive) {
          await serviceClient
            .from("profiles")
            .update({ plan: "free", stripe_subscription_id: null })
            .eq("id", userId);
          break;
        }

        // 年額Priceかどうかで判別
        const yearlyPriceId = process.env.STRIPE_PRICE_ID_PERSONAL_YEARLY;
        const priceId = sub.items.data[0]?.price?.id;
        const updatedPlan = (yearlyPriceId && priceId === yearlyPriceId)
          ? "personal_yearly"
          : "personal_monthly";

        await serviceClient
          .from("profiles")
          .update({ plan: updatedPlan, stripe_subscription_id: sub.id })
          .eq("id", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string);
        if (customer.deleted) break;

        const userId = (customer as Stripe.Customer).metadata?.supabase_user_id;
        if (!userId) break;

        await serviceClient
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", userId);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
