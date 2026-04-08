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
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: "personal_monthly" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setLoading(false);
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
            無料プランは月5通まで。PERSONALプランにアップグレードすると月50通まで生成できます。
          </p>
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--color-text)" }}>
              PERSONALプラン
            </p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--color-primary)" }}>
              ¥1,980<span className="text-sm font-normal" style={{ color: "var(--color-muted)" }}>/月</span>
            </p>
            <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--color-muted)" }}>
              <li>✓ 月50通まで生成</li>
              <li>✓ 全機能利用可能</li>
              <li>✓ いつでも解約可能</li>
            </ul>
          </div>
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full h-12 rounded-xl font-semibold"
            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            {loading ? "処理中..." : "アップグレードする →"}
          </Button>
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
