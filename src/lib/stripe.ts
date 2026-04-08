import Stripe from "stripe";

// 遅延初期化（ビルド時にAPIキーが未設定でも問題ない）
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-03-31.basil",
    });
  }
  return _stripe;
}

// 後方互換のためのエイリアス（APIルートで直接インポートされる場合は getStripe() を使用）
export const stripe = {
  get customers() { return getStripe().customers; },
  get checkout() { return getStripe().checkout; },
  get webhooks() { return getStripe().webhooks; },
  get billingPortal() { return getStripe().billingPortal; },
  get subscriptions() { return getStripe().subscriptions; },
};
