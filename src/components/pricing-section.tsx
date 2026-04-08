"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const scaleUp = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } };
const TRANSITION = { duration: 0.5, ease: "easeOut" as const };
const VIEWPORT = { once: true, margin: "-80px" };

export default function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  async function handleUpgrade() {
    setUpgradeLoading(true);
    const priceId = billing === "yearly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PERSONAL_YEARLY
      : undefined; // checkout APIのデフォルト月額を使用

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        planType: billing === "yearly" ? "personal_yearly" : "personal_monthly",
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setUpgradeLoading(false);
  }

  return (
    <section id="pricing" className="py-20 px-4" style={{ backgroundColor: "var(--color-surface)" }}>
      <div className="max-w-4xl mx-auto">
        <h2
          className="text-3xl font-bold text-center mb-4"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          シンプルな料金体系
        </h2>
        <p className="text-center mb-8 text-base" style={{ color: "var(--color-muted)" }}>
          クレジットカード不要で今すぐ試せます
        </p>

        {/* 月額/年額トグル */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBilling("monthly")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: billing === "monthly" ? "var(--color-primary)" : "transparent",
              color: billing === "monthly" ? "#fff" : "var(--color-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            月額
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
            style={{
              backgroundColor: billing === "yearly" ? "var(--color-primary)" : "transparent",
              color: billing === "yearly" ? "#fff" : "var(--color-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            年額
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#f0faf5", color: "var(--color-accent)" }}
            >
              月700円お得
            </span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* FREEプラン */}
          <motion.div
            variants={scaleUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ ...TRANSITION, delay: 0 }}
            className="rounded-2xl p-8 shadow-sm flex flex-col"
            style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-bg)" }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-muted)" }}>FREE</p>
            <p className="text-4xl font-bold mb-1" style={{ color: "var(--color-primary)" }}>
              ¥0
            </p>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>クレジットカード不要</p>
            <ul className="space-y-3 mb-8 text-sm" style={{ color: "var(--color-text)" }}>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> 月5通まで生成
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> OCR（名刺読み取り）
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> 件名3案・本文3案
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> フォローアップ2案
              </li>
            </ul>
            <Link href="/signup" className="mt-auto">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl font-semibold"
                style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
              >
                無料で始める
              </Button>
            </Link>
          </motion.div>

          {/* PERSONALプラン */}
          <motion.div
            variants={scaleUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ ...TRANSITION, delay: 0.1 }}
            className="rounded-2xl p-8 shadow-md relative flex flex-col"
            style={{ border: `2px solid var(--color-accent)`, backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              おすすめ
            </div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-accent)" }}>PERSONAL</p>
            <div className="flex items-end gap-1 mb-1">
              {billing === "monthly" ? (
                <>
                  <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>¥1,980</p>
                  <p className="text-sm pb-1" style={{ color: "var(--color-muted)" }}>/月</p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>¥15,360</p>
                  <p className="text-sm pb-1" style={{ color: "var(--color-muted)" }}>/年</p>
                </>
              )}
            </div>
            {billing === "yearly" && (
              <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>月換算 ¥1,280（月700円お得）</p>
            )}
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>いつでも解約可能</p>
            <ul className="space-y-3 mb-8 text-sm" style={{ color: "var(--color-text)" }}>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span>{" "}
                <strong>月50通まで生成</strong>
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> OCR（名刺読み取り）
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> 件名3案・本文3案
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> フォローアップ2案
              </li>
              <li className="flex items-center gap-2">
                <span style={{ color: "var(--color-accent)" }}>✓</span> 会社情報パーソナライズ
              </li>
            </ul>
            <Button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="w-full h-12 rounded-xl font-semibold mt-auto"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              {upgradeLoading ? "処理中..." : "今すぐ始める"}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
