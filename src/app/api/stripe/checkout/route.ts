import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // リクエストボディからpriceId・couponIdを取得（省略時はデフォルト月額）
    let priceId: string | undefined;
    let couponId: string | undefined;
    let planType: string = "personal_monthly";

    try {
      const body = await request.json();
      priceId = body.priceId;
      couponId = body.couponId;
      planType = body.planType ?? "personal_monthly";
    } catch {
      // body未指定の場合はデフォルト
    }

    // planTypeからpriceIdを決定（クライアントから渡されない場合のフォールバック）
    if (!priceId) {
      if (planType === "light_monthly") {
        priceId = process.env.STRIPE_PRICE_ID_LIGHT!;
      } else if (planType === "light_yearly") {
        priceId = process.env.STRIPE_PRICE_ID_LIGHT_YEARLY!;
      } else if (planType === "personal_yearly") {
        priceId = process.env.STRIPE_PRICE_ID_PERSONAL_YEARLY!;
      } else {
        priceId = process.env.STRIPE_PRICE_ID_PERSONAL!;
      }
    }

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    // Stripeカスタマー取得 or 作成
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await serviceClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Checkoutセッション作成
    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?upgraded=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      metadata: { supabase_user_id: user.id, plan_type: planType },
    };

    // クーポン適用（初月割引など）
    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "決済処理に失敗しました" }, { status: 500 });
  }
}
