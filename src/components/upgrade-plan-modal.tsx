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

export default function UpgradePlanModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState<"light" | "personal" | null>(null);

  async function handleUpgrade(plan: "light" | "personal") {
    setLoading(plan);
    try {
      const body: Record<string, string> =
        plan === "light"
          ? { planType: "light_monthly", ...(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIGHT_MONTHLY ? { priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIGHT_MONTHLY } : {}) }
          : { planType: "personal_monthly" };

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md" style={{ backgroundColor: "var(--color-surface)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--color-text)" }}>
            今月の上限に達しました
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>
            無料プランは月7通まで。有料プランにアップグレードするとさらに多くのメールを生成できます。
          </p>

          {/* LIGHTプラン */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>LIGHTプラン</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-primary)" }}>
              ¥980<span className="text-sm font-normal" style={{ color: "var(--color-muted)" }}>/月</span>
            </p>
            <p className="text-xs mt-1 mb-3" style={{ color: "var(--color-muted)" }}>月20通まで生成</p>
            <Button
              onClick={() => handleUpgrade("light")}
              disabled={loading !== null}
              className="w-full h-10 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              {loading === "light" ? "処理中..." : "LIGHTプランへ →"}
            </Button>
          </div>

          {/* PERSONALプラン */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg)", border: `2px solid var(--color-accent)` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>PERSONALプラン</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              >
                おすすめ
              </span>
            </div>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-primary)" }}>
              ¥1,980<span className="text-sm font-normal" style={{ color: "var(--color-muted)" }}>/月</span>
            </p>
            <p className="text-xs mt-1 mb-3" style={{ color: "var(--color-muted)" }}>月50通まで生成</p>
            <Button
              onClick={() => handleUpgrade("personal")}
              disabled={loading !== null}
              className="w-full h-10 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              {loading === "personal" ? "処理中..." : "PERSONALプランへ →"}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            今はしない
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
