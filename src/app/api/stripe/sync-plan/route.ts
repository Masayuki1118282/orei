import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

// 決済完了後にStripeのサブスクリプションを確認してplanを同期する
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ plan: profile?.plan ?? "free" });
    }

    // Stripeのアクティブなサブスクリプションを確認
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ plan: "free" });
    }

    const sub = subscriptions.data[0];
    const yearlyPriceId = process.env.STRIPE_PRICE_ID_PERSONAL_YEARLY;
    const priceId = sub.items.data[0]?.price?.id;
    const plan = (yearlyPriceId && priceId === yearlyPriceId)
      ? "personal_yearly"
      : "personal_monthly";

    // DBを更新
    await serviceClient
      .from("profiles")
      .update({ plan, stripe_subscription_id: sub.id })
      .eq("id", user.id);

    console.log(`[sync-plan] Updated user ${user.id} to plan: ${plan}`);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error("[sync-plan] error:", error);
    return NextResponse.json({ error: "同期に失敗しました" }, { status: 500 });
  }
}
