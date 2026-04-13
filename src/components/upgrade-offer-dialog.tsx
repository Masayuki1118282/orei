"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const STORAGE_KEY = "orei_offer_dismissed";

export function shouldShowOffer(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}

export default function UpgradeOfferDialog({ open, onClose }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<"light" | "personal">("light");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "1");
    onClose();
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const isYearly = billing === "yearly";
      const body: Record<string, string> = {};

      if (selectedPlan === "light") {
        if (isYearly) {
          body.planType = "light_yearly";
          const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIGHT_YEARLY;
          if (priceId) body.priceId = priceId;
        } else {
          body.planType = "light_monthly";
          const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIGHT_MONTHLY;
          if (priceId) body.priceId = priceId;
          const couponId = process.env.NEXT_PUBLIC_STRIPE_COUPON_LIGHT_FIRST_MONTH;
          if (couponId) body.couponId = couponId;
        }
      } else {
        if (isYearly) {
          body.planType = "personal_yearly";
          const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PERSONAL_YEARLY;
          if (priceId) body.priceId = priceId;
        } else {
          body.planType = "personal_monthly";
          const couponId = process.env.NEXT_PUBLIC_STRIPE_COUPON_FIRST_MONTH;
          if (couponId) body.couponId = couponId;
        }
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  const isLight = selectedPlan === "light";

  const monthlyPrice = isLight ? "¥980" : "¥1,980";
  const monthlyFirstPrice = isLight ? "¥480" : "¥980";
  const yearlyPrice = isLight ? "¥8,160" : "¥15,360";
  const yearlyMonthly = isLight ? "¥680" : "¥1,280";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md" style={{ backgroundColor: "var(--color-surface)" }}>
        <DialogHeader>
          <DialogTitle
            className="text-xl"
            style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
          >
            🎉 閉じないで！特別オファー
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* プラン選択 */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            {(["light", "personal"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSelectedPlan(p)}
                className="flex-1 py-2 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: selectedPlan === p ? "var(--color-accent)" : "var(--color-surface)",
                  color: selectedPlan === p ? "#fff" : "var(--color-muted)",
                }}
              >
                {p === "light" ? "LIGHT" : "PERSONAL"}
              </button>
            ))}
          </div>

          {/* 特別価格バナー */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "#f0faf5", border: "1px solid #b6e4ce" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-accent)" }}>
              今だけ初月特別価格
            </p>
            {billing === "monthly" ? (
              <>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                  {monthlyFirstPrice.replace("¥", "")}<span className="text-lg">円</span>
                </p>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                  通常 {monthlyPrice}/月
                </p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
                  {yearlyPrice}
                </p>
                <p className="text-sm" style={{ color: "var(--color-accent)" }}>
                  月換算 {yearlyMonthly}
                </p>
              </>
            )}
          </div>

          {/* 月額/年額 */}
          <div className="space-y-3">
            <label
              className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: billing === "monthly"
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
                backgroundColor: billing === "monthly" ? "#f0faf5" : "var(--color-bg)",
              }}
            >
              <input
                type="radio"
                name="billing"
                value="monthly"
                checked={billing === "monthly"}
                onChange={() => setBilling("monthly")}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                  月額プラン
                </p>
                <p className="text-sm" style={{ color: "var(--color-accent)" }}>
                  初月 <strong>{monthlyFirstPrice}</strong>
                  <span style={{ color: "var(--color-muted)" }}>
                    {" "}→ 翌月から {monthlyPrice}/月
                  </span>
                </p>
              </div>
            </label>

            <label
              className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all"
              style={{
                border: billing === "yearly"
                  ? "2px solid var(--color-accent)"
                  : "1px solid var(--color-border)",
                backgroundColor: billing === "yearly" ? "#f0faf5" : "var(--color-bg)",
              }}
            >
              <input
                type="radio"
                name="billing"
                value="yearly"
                checked={billing === "yearly"}
                onChange={() => setBilling("yearly")}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                  年額プラン{" "}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                  >
                    {isLight ? "月300円" : "月700円"}お得
                  </span>
                </p>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                  {yearlyPrice}/年（月換算 {yearlyMonthly}）
                </p>
              </div>
            </label>
          </div>

          <p className="text-xs text-center" style={{ color: "var(--color-muted)" }}>
            {isLight ? "月20通" : "月50通"}まで生成 ・ いつでも解約可能
          </p>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-base"
            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            {loading ? "処理中..." : "今すぐ申し込む →"}
          </Button>

          <button
            onClick={handleClose}
            className="w-full text-sm text-center"
            style={{ color: "var(--color-muted)" }}
          >
            閉じる（通常料金で後から申込）
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
