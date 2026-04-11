"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PricingSection from "@/components/pricing-section";
import { motion, useInView } from "framer-motion";
import {
  Mail,
  Copy,
  Bot,
  Camera,
  Sparkles,
  Send,
  FileText,
  RefreshCw,
  Building2,
  ScanLine,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Timer,
} from "lucide-react";

// ─── アニメーション定数 ───────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const EASE = "easeOut" as const;
const VIEWPORT = { once: true, margin: "-80px" };

// ─── カウントアップフック ─────────────────────────────────────
function useCountUp(target: number, duration: number = 1.5) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return { ref, display };
}

// ─── FAQ ─────────────────────────────────────────────────────
const FAQ = [
  {
    q: "AIが書いたってバレませんか？",
    a: "OREIは「AIが書いた感」が出ないよう、人間らしい自然な表現を徹底しています。相手の会社名・役職・事業内容を自然に組み込み、押し売り感のない関係構築重視の文体で生成します。",
  },
  {
    q: "名刺の写真が読み取れなかったらどうなりますか？",
    a: "OCRが失敗した場合は自動的に手動入力モードに切り替わります。氏名・会社名など必要な情報を直接入力するだけで、同じ品質のメールを生成できます。",
  },
  {
    q: "どのメールソフトからでも送れますか？",
    a: "はい。生成したメールをコピーして、お使いのメールソフト（Gmail・Outlook・Apple メール等）から送るだけです。「Gmail で開く」ボタンもあり、ワンタップで下書きが開きます。",
  },
  {
    q: "無料プランに期間制限はありますか？",
    a: "ありません。月5通の使用量制限のみで、期間制限はありません。クレジットカードの登録も不要です。",
  },
  {
    q: "解約はいつでもできますか？",
    a: "はい、いつでも解約できます。解約後も当月末まではPERSONALプランをご利用いただけます。",
  },
  {
    q: "個人情報（名刺データ）はどう管理されますか？",
    a: "名刺データはお客様のアカウントにのみ紐づけて保管します。第三者への提供や、AI学習への利用は一切行いません。データはいつでも削除できます。",
  },
];

// ─── ヒーローモックアップ ────────────────────────────────────
function HeroMockup() {
  const [selected, setSelected] = useState(0);

  const subjects = [
    "昨日はお時間をいただきありがとうございました",
    "田中様、本日はご丁寧にありがとうございました",
    "名刺交換のお礼 ／ 株式会社〇〇 山田",
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl border"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
    >
      {/* ブラウザバー */}
      <div
        className="flex items-center gap-1.5 px-4 py-3"
        style={{ backgroundColor: "#f3f4f6", borderBottom: "1px solid var(--color-border)" }}
      >
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-yellow-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div
          className="ml-3 flex-1 rounded-md h-6 flex items-center px-3 text-xs"
          style={{ backgroundColor: "#fff", color: "var(--color-muted)" }}
        >
          app.orei.jp/contacts/new
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* 宛先カード */}
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ backgroundColor: "#f9fafb", border: "1px solid var(--color-border)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            田
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>田中 健一 様</p>
            <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>株式会社サンプル｜営業部長</p>
          </div>
          <div
            className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: "#f0faf5", color: "var(--color-accent)" }}
          >
            AI生成済
          </div>
        </div>

        {/* 件名選択 */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--color-muted)" }}>
            <Sparkles size={11} color="var(--color-accent)" />
            件名を選んでください（3案）
          </p>
          <div className="space-y-2">
            {subjects.map((subject, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="w-full flex items-start gap-2.5 p-3 rounded-xl text-left transition-all"
                style={{
                  backgroundColor: selected === i ? "#f0faf5" : "#f9fafb",
                  border: `1.5px solid ${selected === i ? "var(--color-accent)" : "var(--color-border)"}`,
                }}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{
                    backgroundColor: selected === i ? "var(--color-accent)" : "transparent",
                    border: `2px solid ${selected === i ? "var(--color-accent)" : "#d1d5db"}`,
                  }}
                >
                  {selected === i && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-xs leading-relaxed" style={{ color: "var(--color-text)" }}>
                  {subject}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            <Copy size={13} />
            コピー
          </button>
          <button
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: "#f0faf5", color: "var(--color-accent)", border: "1px solid #b6e4ce" }}
          >
            <Mail size={13} />
            Gmail で開く
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 機能1: メール選択UI ─────────────────────────────────────
function Feature1Visual() {
  const subjects = [
    "先日の展示会でのご縁に感謝して",
    "〇〇様とお話できて光栄でした",
    "ご挨拶のお礼とご提案につきまして",
  ];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="rounded-2xl overflow-hidden shadow-lg border"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <Mail size={15} color="rgba(255,255,255,0.7)" />
        <span className="text-sm font-semibold text-white">メールを選択してください</span>
      </div>
      {/* 選択肢 */}
      <div className="p-4 space-y-3" style={{ backgroundColor: "#f9fafb" }}>
        {subjects.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.15 }}
            className="rounded-xl p-3.5 flex items-start gap-3"
            style={{
              backgroundColor: i === 1 ? "#f0faf5" : "#fff",
              border: `1.5px solid ${i === 1 ? "#3D9E72" : "var(--color-border)"}`,
            }}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{
                backgroundColor: i === 1 ? "#3D9E72" : "transparent",
                border: `2px solid ${i === 1 ? "#3D9E72" : "#d1d5db"}`,
              }}
            >
              {i === 1 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <span className="text-xs leading-relaxed" style={{ color: "var(--color-text)", fontWeight: i === 1 ? 600 : 400 }}>
              {s}
            </span>
          </motion.div>
        ))}
      </div>
      {/* ボタン */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.55 }}
        className="px-4 pb-4" style={{ backgroundColor: "#f9fafb" }}
      >
        <div
          className="rounded-xl py-3 flex items-center justify-center gap-2 text-sm font-bold"
          style={{ backgroundColor: "#3D9E72", color: "#fff" }}
        >
          <Copy size={14} />
          コピーする
        </div>
      </motion.div>
    </div>
  );
}

// ─── 機能2: フォローアップタイムライン ────────────────────────
function Feature2Visual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const items = [
    { day: "今日", label: "お礼メール送信済み", badge: "送信済み ✓", color: "#3D9E72", preview: "" },
    { day: "3日後", label: "フォローアップA 準備完了", badge: "準備完了", color: "#1B3A6B", preview: "〇〇の件、その後いかがでしょうか" },
    { day: "7日後", label: "フォローアップB 準備完了", badge: "準備完了", color: "#1B3A6B", preview: "改めてご提案させていただきたく" },
  ];

  return (
    <div ref={ref} className="py-2 px-2">
      <div className="relative pl-8">
        {/* 縦線 */}
        <div
          className="absolute left-3.5 top-4 bottom-4 w-0.5"
          style={{ backgroundColor: "#1B3A6B", opacity: 0.2 }}
        />
        <div className="space-y-5">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.2 }}
              className="relative"
            >
              {/* ドット */}
              <div
                className="absolute -left-8 top-3.5 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ backgroundColor: "#3D9E72", boxShadow: "0 0 0 3px #3D9E7220" }}
              />
              <div
                className="rounded-xl p-4 shadow-sm"
                style={{ backgroundColor: "#fff", border: "1px solid var(--color-border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>
                    {item.day}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: i === 0 ? "#f0faf5" : "#eef2ff",
                      color: i === 0 ? "#3D9E72" : "#6366f1",
                    }}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                  {item.label}
                </p>
                {item.preview && (
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    「{item.preview}」
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 機能3: 会社情報パーソナライズフロー ──────────────────────
function Feature3Visual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const steps = [
    {
      icon: "🌐",
      bg: "#eef2ff",
      border: "#c7d2fe",
      label: "会社HP取得",
      sub: "Webサイトを自動スキャン",
    },
    {
      icon: "📋",
      bg: "#fff",
      border: "var(--color-border)",
      label: "取得した情報",
      sub: "業種: SaaS　事業: 営業支援",
    },
    {
      icon: "✉",
      bg: "#f0faf5",
      border: "#b6e4ce",
      label: "生成されたメール",
      sub: "「営業支援SaaSを展開される御社に…」",
    },
  ];

  return (
    <div ref={ref} className="space-y-3 py-2">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.45, ease: "easeOut", delay: i * 0.3 }}
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: step.bg, border: `1.5px solid ${step.border}` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{step.icon}</span>
              <div>
                <p className="text-xs font-bold" style={{ color: "var(--color-primary)" }}>{step.label}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-muted)" }}>{step.sub}</p>
              </div>
            </div>
          </motion.div>
          {i < steps.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.3, delay: i * 0.3 + 0.2 }}
              className="flex flex-col items-center gap-0.5"
            >
              <div className="w-0.5 h-3" style={{ backgroundColor: "var(--color-primary)", opacity: 0.3 }} />
              <span className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>↓ AI解析</span>
              <div className="w-0.5 h-3" style={{ backgroundColor: "var(--color-primary)", opacity: 0.3 }} />
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── 機能4: 名刺OCRスキャン + フォーム ───────────────────────
function Feature4Visual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 items-start">
      {/* 名刺イメージ */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-xl p-5 shadow-md"
          style={{
            backgroundColor: "#fff",
            border: "1px solid var(--color-border)",
            aspectRatio: "1.7 / 1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <p className="text-xs font-bold mb-3" style={{ color: "var(--color-primary)", fontSize: "10px" }}>
            株式会社〇〇
          </p>
          <p className="font-bold mb-1" style={{ color: "var(--color-text)", fontSize: "13px" }}>
            田中 太郎
          </p>
          <p style={{ color: "var(--color-muted)", fontSize: "9px" }}>営業部 部長</p>
          <p style={{ color: "var(--color-muted)", fontSize: "9px" }}>tanaka@xxx.co.jp</p>
          <p style={{ color: "var(--color-muted)", fontSize: "9px" }}>03-xxxx-xxxx</p>

          {/* スキャンライン */}
          {inView && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "2px",
                backgroundColor: "#3D9E72",
                opacity: 0.7,
                animation: "scanLine 1.6s ease-in-out 0.3s 2",
              }}
            />
          )}
        </motion.div>
      </div>

      {/* フォーム */}
      <div className="space-y-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="flex items-center justify-end mb-1"
        >
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ backgroundColor: "#f0faf5", color: "#3D9E72" }}
          >
            読み取り完了 ✓
          </span>
        </motion.div>
        {[
          { label: "氏名", value: "田中 太郎" },
          { label: "会社", value: "株式会社〇〇" },
          { label: "役職", value: "営業部 部長" },
          { label: "メール", value: "tanaka@xxx..." },
        ].map((row, i) => (
          <motion.div
            key={row.label}
            initial={{ opacity: 0, x: 12 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs flex-shrink-0 w-10" style={{ color: "var(--color-muted)", fontSize: "10px" }}>
              {row.label}
            </span>
            <div
              className="flex-1 rounded-lg px-2 py-1.5 text-xs font-medium truncate"
              style={{ backgroundColor: "#f0faf5", color: "var(--color-text)", border: "1px solid #b6e4ce", fontSize: "10px" }}
            >
              {row.value}
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
    </div>
  );
}

// ─── メインコンポーネント ────────────────────────────────────
export default function LandingPage() {
  // カウントアップ
  const count97 = useCountUp(97);
  const count24 = useCountUp(24);
  const count3 = useCountUp(3);

  return (
    <div style={{ backgroundColor: "var(--color-bg)" }}>
      {/* ━━━ ヘッダー ━━━ */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <span
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          OREI
        </span>
        <div className="flex items-center gap-4">
          <Link href="/features" className="text-sm hidden sm:block" style={{ color: "var(--color-muted)" }}>
            機能一覧
          </Link>
          <Link href="/login" className="text-sm hidden sm:block" style={{ color: "var(--color-muted)" }}>
            ログイン
          </Link>
          <Link href="/signup">
            <Button
              className="h-10 px-5 rounded-lg font-semibold text-sm"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              無料で始める
            </Button>
          </Link>
        </div>
      </header>

      {/* ━━━ ① Hero ━━━ */}
      <section className="px-6 pt-28 pb-32" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* テキスト */}
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: EASE, delay: 0 }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
                style={{ backgroundColor: "#f0faf5", color: "var(--color-accent)", border: "1px solid #b6e4ce" }}
              >
                <Sparkles size={12} />
                名刺交換後のお礼メールを3秒で
              </div>
              <h1
                className="font-bold mb-6"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: "var(--color-primary)",
                  fontSize: "clamp(24px, 4vw, 42px)",
                  lineHeight: 1.2,
                }}
              >
                「また会いたい」と<br />
                思われる営業は、<br />
                翌日にメールを<br className="lg:hidden" />送っている。
              </h1>
            </motion.div>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
              className="mb-10"
              style={{ color: "var(--color-muted)", fontSize: "18px", lineHeight: 1.8, maxWidth: "480px" }}
            >
              名刺を撮影するだけ。相手の会社・事業内容をAIが自動で調べ、
              押し売り感ゼロの丁寧なお礼メールを生成します。
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            >
              <Link href="/signup">
                <Button
                  className="h-14 px-10 rounded-xl font-bold text-base shadow-lg"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                >
                  無料で始める
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <p className="mt-3 text-sm" style={{ color: "var(--color-muted)" }}>
                クレジットカード不要・登録2分
              </p>
            </motion.div>
          </div>

          {/* モックアップ */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
          >
            <HeroMockup />
          </motion.div>
        </div>
      </section>

      {/* ━━━ ② 数字で見る課題 ━━━ */}
      <section className="px-6 py-28" style={{ backgroundColor: "var(--color-primary)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center text-sm font-semibold mb-16 tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Why OREI
          </motion.p>
          <div className="grid sm:grid-cols-3 gap-12 text-center">
            {/* 97% */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE, delay: 0 }}
            >
              <div className="flex justify-center mb-4">
                <Users size={48} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
              </div>
              <div
                className="font-bold leading-none mb-3"
                style={{ fontSize: "72px", fontFamily: "var(--font-heading)", color: "#fff" }}
              >
                <span ref={count97.ref}>{count97.display}</span>%
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                名刺交換後にお礼メールを<br />送らない営業担当者の割合
              </p>
            </motion.div>
            {/* 24h */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            >
              <div className="flex justify-center mb-4">
                <Timer size={48} color="rgba(255,255,255,0.3)" strokeWidth={1.5} />
              </div>
              <div
                className="font-bold leading-none mb-3"
                style={{ fontSize: "72px", fontFamily: "var(--font-heading)", color: "#fff" }}
              >
                <span ref={count24.ref}>{count24.display}</span>h
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                商談後の印象が<br />最も残る時間
              </p>
            </motion.div>
            {/* 3秒 */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            >
              <div className="flex justify-center mb-4">
                <BarChart3 size={48} color="rgba(61,158,114,0.6)" strokeWidth={1.5} />
              </div>
              <div
                className="font-bold leading-none mb-3"
                style={{ fontSize: "72px", fontFamily: "var(--font-heading)", color: "var(--color-accent)" }}
              >
                <span ref={count3.ref}>{count3.display}</span>秒
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                OREIでメールが<br />完成するまでの時間
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ ③ 問題提起 ━━━ */}
      <section className="px-6 py-28" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-16"
          >
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "40px" }}
            >
              こんな経験、ありませんか？
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: "メールを考える時間が、もったいない",
                desc: "「何を書けばいい？」「失礼じゃないかな？」と悩むだけで30分。その時間、本来は別の商談や提案に使えたはずです。",
              },
              {
                icon: Mail,
                title: "送ろうと思ったまま、3日が経っていた",
                desc: "展示会後の疲労と業務に追われ、気づけば相手の記憶が薄れるタイミングを逃してしまう。鉄は熱いうちに打てとわかっていても、体が動かない。",
              },
              {
                icon: Copy,
                title: "毎回同じ文章になって、埋もれる気がする",
                desc: "テンプレ感が出てしまい、相手に「誰にでも送っている」と思われてしまう。個別感を出したくても、手間をかける余裕がない。",
              },
              {
                icon: Bot,
                title: "ChatGPTで書いたら、明らかにAIっぽくなった",
                desc: "汎用AIでは相手の会社情報を自分で調べて入力する手間があり、結果として「それっぽいだけ」の文章になってしまう。",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
                className="rounded-2xl p-8 shadow-sm"
                style={{ backgroundColor: "#f9fafb" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ backgroundColor: "#fee2e2" }}
                >
                  <item.icon size={24} color="#ef4444" strokeWidth={1.5} />
                </div>
                <h3
                  className="font-semibold mb-3"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-text)", fontSize: "18px" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ ④ 解決提案 ━━━ */}
      <section className="px-6 py-28" style={{ backgroundColor: "#f0faf5" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          {/* 左テキスト */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <h2
              className="font-bold mb-6"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "40px", lineHeight: 1.25 }}
            >
              OREIが、名刺交換の<br />翌日を変える
            </h2>
            <p className="mb-10 leading-relaxed" style={{ color: "var(--color-muted)", fontSize: "16px" }}>
              相手の会社情報をAIが自動で調査。<br />
              その情報をもとに、ちょっとだけ気の利いた<br />
              パーソナライズされたお礼メールを3秒で生成し、<br />
              翌日のアクションを確実に実行できます。
            </p>
          </motion.div>

          {/* 右ステップ */}
          <div className="space-y-5">
            {[
              {
                step: "01",
                icon: Camera,
                title: "名刺を撮影 or 手動入力",
                desc: "スマホで名刺を撮影するだけ。AIが自動で情報を読み取ります。",
                delay: 0.1,
              },
              {
                step: "02",
                icon: Sparkles,
                title: "AIが会社情報を調べてメール生成",
                desc: "相手の事業内容をリサーチし、パーソナライズされた3案を作成。",
                delay: 0.2,
              },
              {
                step: "03",
                icon: Send,
                title: "コピーして自分のメーラーから送信",
                desc: "Gmail・Outlook など普段お使いのメールから送るだけ。",
                delay: 0.3,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                transition={{ duration: 0.6, ease: EASE, delay: item.delay }}
                className="flex gap-5 items-start rounded-2xl p-6"
                style={{ backgroundColor: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff", fontFamily: "var(--font-heading)" }}
                >
                  {item.step}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon size={16} color="var(--color-accent)" />
                    <h3 className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ ⑤ 機能紹介 ━━━ */}
      <section className="px-6 py-28" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-20"
          >
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "40px" }}
            >
              一度の名刺交換を、長期的な関係へ
            </h2>
          </motion.div>

          <div className="space-y-24">

            {/* 機能1: 件名3案・本文3案 */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                  style={{ backgroundColor: "#3D9E7215", color: "#3D9E72" }}>
                  <FileText size={14} />機能
                </div>
                <h3 className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "26px" }}>
                  件名3案・本文3案
                </h3>
                <p className="font-medium mb-3 leading-relaxed" style={{ color: "var(--color-text)" }}>
                  迷わない。3案から選ぶだけ。
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  毎回ゼロから考える必要はありません。AIが状況に応じた3パターンを生成するので、最適な1案を選んでコピーするだけ。件名・本文・フォローアップがすべてセットで揃います。
                </p>
              </div>
              <Feature1Visual />
            </motion.div>

            {/* 機能2: フォローアップ自動作成 */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE }}
              className="grid lg:grid-cols-2 gap-12 items-center lg:[direction:rtl]"
            >
              <div className="lg:[direction:ltr]">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                  style={{ backgroundColor: "#6366f115", color: "#6366f1" }}>
                  <RefreshCw size={14} />機能
                </div>
                <h3 className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "26px" }}>
                  フォローアップ自動作成
                </h3>
                <p className="font-medium mb-3 leading-relaxed" style={{ color: "var(--color-text)" }}>
                  追うタイミングを、もう逃さない。
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  お礼メールと同時に、3日後・7日後のフォローアップも自動生成。「そろそろ連絡しようと思っていた」を、最初の1通で先回りします。
                </p>
              </div>
              <div className="lg:[direction:ltr]">
                <Feature2Visual />
              </div>
            </motion.div>

            {/* 機能3: 会社情報パーソナライズ */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE }}
              className="grid lg:grid-cols-2 gap-12 items-center"
            >
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                  style={{ backgroundColor: "#f59e0b15", color: "#f59e0b" }}>
                  <Building2 size={14} />機能
                </div>
                <h3 className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "26px" }}>
                  会社情報パーソナライズ
                </h3>
                <p className="font-medium mb-3 leading-relaxed" style={{ color: "var(--color-text)" }}>
                  相手の事業を知った上で、書く。
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  汎用テンプレートとは違い、相手の業種・サービス・事業課題を踏まえた文章を生成。「調べてくれているんだ」と感じさせる、気の利いた一文が自然に入ります。
                </p>
              </div>
              <Feature3Visual />
            </motion.div>

            {/* 機能4: 名刺OCR読み取り */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE }}
              className="grid lg:grid-cols-2 gap-12 items-center lg:[direction:rtl]"
            >
              <div className="lg:[direction:ltr]">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                  style={{ backgroundColor: "#1B3A6B15", color: "#1B3A6B" }}>
                  <ScanLine size={14} />機能
                </div>
                <h3 className="font-bold mb-2"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "26px" }}>
                  名刺OCR読み取り
                </h3>
                <p className="font-medium mb-3 leading-relaxed" style={{ color: "var(--color-text)" }}>
                  撮影するだけ。入力は不要。
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  スマホカメラで名刺を撮影すると、氏名・会社名・役職・メールアドレスをAIが自動で読み取りフォームに入力。読み取れなかった場合は手動入力モードに自動切り替えします。
                </p>
              </div>
              <div className="lg:[direction:ltr]">
                <Feature4Visual />
              </div>
            </motion.div>

          </div>

          {/* 全機能リンク */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.5, ease: EASE }}
            className="text-center mt-16"
          >
            <Link href="/features">
              <Button
                variant="outline"
                className="h-12 px-8 rounded-xl font-semibold text-sm"
                style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
              >
                全機能を見る
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━ ⑥ Before/After ━━━ */}
      <section className="px-6 py-28" style={{ backgroundColor: "#f0f4fa" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-16"
          >
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "40px", lineHeight: 1.3 }}
            >
              送れる人と、送れない人。<br />差はここで生まれる。
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Before */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE }}
              className="rounded-2xl p-8"
              style={{ backgroundColor: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#fee2e2" }}
                >
                  <XCircle size={18} color="#ef4444" />
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#ef4444", fontFamily: "var(--font-heading)" }}>
                  Before
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  "名刺をもらったまま放置",
                  "翌週に連絡しても印象は薄い",
                  "毎回ゼロから文章を考える",
                  "展示会後に100枚の名刺が山積み",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#d1d5db" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>{text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* After */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.6, ease: EASE }}
              className="rounded-2xl p-8"
              style={{
                background: "linear-gradient(135deg, #1B3A6B 0%, #2a5298 100%)",
                boxShadow: "0 2px 16px rgba(27,58,107,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(61,158,114,0.3)" }}
                >
                  <CheckCircle2 size={18} color="#3D9E72" />
                </div>
                <h3 className="font-bold text-lg" style={{ color: "#fff", fontFamily: "var(--font-heading)" }}>
                  After with OREI
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  "翌日に丁寧なお礼メールを送信",
                  "印象が残り、返信率が上がる",
                  "3秒で3案生成、選ぶだけ",
                  "展示会後もその日のうちに対応完了",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <CheckCircle2 size={16} color="var(--color-accent)" className="mt-0.5 flex-shrink-0" />
                    <p className="text-sm leading-relaxed font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ ⑦ 価格根拠 ━━━ */}
      <section className="px-6 py-20" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold mb-3 tracking-widest uppercase" style={{ color: "var(--color-accent)" }}>
              なぜ月1,980円なのか
            </p>
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "36px" }}
            >
              営業1人あたりの<br />月間コストを計算してみました
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Clock,
                color: "#6366f1",
                label: "節約できる時間",
                value: "25時間",
                sub: "月30分×50通のメール作成",
                detail: "従来 30分/通 → OREI 3秒/通",
              },
              {
                icon: Zap,
                color: "var(--color-accent)",
                label: "1通あたりのコスト",
                value: "¥39",
                sub: "月1,980円 ÷ 50通",
                detail: "外注費の1/100以下",
              },
              {
                icon: TrendingUp,
                color: "#f59e0b",
                label: "返信率の差",
                value: "3.2×",
                sub: "翌日送信 vs 3日後送信",
                detail: "タイミングが成約率を左右する",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={VIEWPORT}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
                className="rounded-2xl p-7 text-center"
                style={{ backgroundColor: "#f9fafb", border: "1px solid var(--color-border)" }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ backgroundColor: item.color + "15" }}
                >
                  <item.icon size={28} color={item.color} strokeWidth={1.5} />
                </div>
                <p className="text-xs font-semibold mb-1 tracking-wide uppercase" style={{ color: "var(--color-muted)" }}>
                  {item.label}
                </p>
                <p
                  className="font-bold mb-1"
                  style={{ fontSize: "36px", fontFamily: "var(--font-heading)", color: "var(--color-primary)", lineHeight: 1.1 }}
                >
                  {item.value}
                </p>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-text)" }}>
                  {item.sub}
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE, delay: 0.3 }}
            className="rounded-2xl p-6 text-center"
            style={{ backgroundColor: "#f0faf5", border: "1px solid #b6e4ce" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
              <strong style={{ color: "var(--color-accent)" }}>月1,980円</strong>は、
              コーヒー1杯分のコストで、営業担当者の<strong>毎月25時間</strong>を解放します。<br />
              受注1件の利益と比べれば、<strong>ROIは計算するまでもありません。</strong>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ━━━ ⑧ 料金 ━━━ */}
      <PricingSection />

      {/* ━━━ ⑨ FAQ ━━━ */}
      <section className="px-6 py-28" style={{ backgroundColor: "#fff" }}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="text-center mb-16"
          >
            <h2
              className="font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "40px" }}
            >
              よくある質問
            </h2>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
          >
            <Accordion multiple={false} className="space-y-3">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={i}
                  className="rounded-2xl px-6"
                  style={{
                    border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <AccordionTrigger
                    className="text-left font-semibold py-5"
                    style={{ color: "var(--color-text)", fontSize: "15px" }}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent
                    className="pb-5 text-sm leading-relaxed"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* ━━━ ⑩ 最終CTA ━━━ */}
      <section className="px-6 py-28 text-center" style={{ backgroundColor: "var(--color-primary)" }}>
        <div className="max-w-3xl mx-auto">
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-bold mb-5"
            style={{ fontFamily: "var(--font-heading)", color: "#fff", fontSize: "clamp(28px, 4vw, 44px)", lineHeight: 1.25 }}
          >
            「送れた人」だけが、<br />次の商談に呼ばれる。
          </motion.h2>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="mb-10 text-base"
            style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}
          >
            今すぐ1通、試してください。
          </motion.p>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
            transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
            className="flex flex-col items-center gap-3"
          >
            <Link href="/signup">
              <Button
                className="h-14 px-12 rounded-xl font-bold text-base shadow-lg"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              >
                まずは無料で試してみる
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              月5通まで無料 · カード登録なし · 2分で完了
            </p>
          </motion.div>
        </div>
      </section>

      {/* フッター */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/privacy" style={{ color: "var(--color-muted)" }}>プライバシーポリシー</Link>
          <Link href="/tokushoho" style={{ color: "var(--color-muted)" }}>特定商取引法に基づく表記</Link>
        </div>
        <p>© 2026 OREI. All rights reserved.</p>
      </footer>
    </div>
  );
}
