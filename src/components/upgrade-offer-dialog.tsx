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
      const body: Record<string, string> = {
        planType: isYearly ? "personal_yearly" : "personal_monthly",
      };

      if (isYearly) {
        // 年額: クーポンなし、年額Price ID
        const yearlyPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PERSONAL_YEARLY;
        if (yearlyPriceId) body.priceId = yearlyPriceId;
      } else {
        // 月額: 初月クーポン適用
        const couponId = process.env.NEXT_PUBLIC_STRIPE_COUPON_FIRST_MONTH;
        if (couponId) body.couponId = couponId;
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

        <div className="mt-2 space-y-5">
          {/* 特別価格バナー */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "#f0faf5", border: "1px solid #b6e4ce" }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: "var(--color-accent)" }}>
              今だけ初月特別価格
            </p>
            <p className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
              980<span className="text-lg">円</span>
            </p>
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              通常 ¥1,980/月
            </p>
          </div>

          {/* プラン選択 */}
          <div className="space-y-3">
            {/* 月額 */}
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
                  初月 <strong>¥980</strong>
                  <span style={{ color: "var(--color-muted)" }}>
                    {" "}→ 翌月から ¥1,980/月
                  </span>
                </p>
              </div>
            </label>

            {/* 年額 */}
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
                    1ヶ月分お得
                  </span>
                </p>
                <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                  ¥15,360/年（月換算 ¥1,280）
                </p>
              </div>
            </label>
          </div>

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
