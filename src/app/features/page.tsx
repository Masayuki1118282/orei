"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ScanLine,
  Mail,
  Building2,
  BookOpen,
  Settings,
  ArrowRight,
  CheckCircle2,
  Camera,
  FlipHorizontal,
  PenLine,
  Sparkles,
  RefreshCw,
  MessageSquare,
  History,
  Tag,
  Globe,
  LayoutList,
  Clock,
  Send,
  Copy,
  Signature,
  StickyNote,
  ListChecks,
} from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const EASE = "easeOut" as const;
const VIEWPORT = { once: true, margin: "-60px" };

type Feature = {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string;
};

type Category = {
  id: string;
  label: string;
  color: string;
  bg: string;
  icon: React.ElementType;
  features: Feature[];
};

const CATEGORIES: Category[] = [
  {
    id: "ocr",
    label: "名刺読み取り",
    color: "#1B3A6B",
    bg: "#1B3A6B15",
    icon: ScanLine,
    features: [
      {
        icon: Camera,
        title: "名刺表面 OCR読み取り",
        desc: "スマホで名刺を撮影するだけ。氏名・会社名・役職・メール・電話番号・URLを自動抽出。",
      },
      {
        icon: FlipHorizontal,
        title: "名刺裏面対応",
        desc: "表面と裏面の2枚をアップロードすると、両面の情報を統合して抽出。裏面の追加情報はメモに自動格納。",
        badge: "NEW",
      },
      {
        icon: PenLine,
        title: "手動入力モード",
        desc: "OCRが失敗した場合や手入力したい場合は、手動入力タブに切り替えて直接入力できます。",
      },
    ],
  },
  {
    id: "generate",
    label: "メール生成",
    color: "#3D9E72",
    bg: "#3D9E7215",
    icon: Mail,
    features: [
      {
        icon: Sparkles,
        title: "件名3案・本文3案 生成",
        desc: "AIが状況に応じた3パターンを一括生成。最適な1案を選んでコピーするだけ。",
      },
      {
        icon: Tag,
        title: "挨拶メール / 新規アプローチ の2モード",
        desc: "名刺交換後のお礼メールと、まだ面識のない相手へのコールドDMを切り替えて生成。生成済みメールにはバッジで種別表示。",
        badge: "NEW",
      },
      {
        icon: MessageSquare,
        title: "商談メモを反映したパーソナライズ",
        desc: "「製造業のDX推進に関心あり」など会話内容を入力すると、その内容を踏まえたパーソナルなメールを生成。",
        badge: "NEW",
      },
      {
        icon: RefreshCw,
        title: "フォローアップ自動生成",
        desc: "お礼メールと同時に、3日後・7日後のフォローアップ文もセットで生成。追うタイミングを逃しません。",
      },
      {
        icon: History,
        title: "生成履歴の保存・復元",
        desc: "連絡先ページを開くと、前回生成したメールが自動で復元。再生成せずそのまま使えます。",
        badge: "NEW",
      },
    ],
  },
  {
    id: "company",
    label: "会社情報リサーチ",
    color: "#f59e0b",
    bg: "#f59e0b15",
    icon: Building2,
    features: [
      {
        icon: Globe,
        title: "WebサイトからAI自動スキャン",
        desc: "名刺のURLをもとに会社のWebサイトを自動取得。業種・事業内容・サービスを解析します。",
      },
      {
        icon: Sparkles,
        title: "事業内容を踏まえた文章生成",
        desc: "「営業支援SaaSを展開される御社に…」のように、相手の事業に自然に触れた文章を生成。",
      },
    ],
  },
  {
    id: "contacts",
    label: "連絡先管理",
    color: "#6366f1",
    bg: "#6366f115",
    icon: BookOpen,
    features: [
      {
        icon: LayoutList,
        title: "名刺情報の保存・一覧表示",
        desc: "登録した連絡先を一覧で管理。会社名・氏名・送信済みステータスを一目で確認。",
      },
      {
        icon: StickyNote,
        title: "メモのタイムライン管理",
        desc: "連絡先ごとに日付付きのメモを追加。「展示会で名刺交換」など経緯を時系列で記録・参照できます。",
        badge: "NEW",
      },
      {
        icon: ListChecks,
        title: "送信済みチェック",
        desc: "メールを送ったらチェックを入れるだけ。未送信の連絡先を把握して送り忘れをゼロに。",
      },
    ],
  },
  {
    id: "settings",
    label: "パーソナライズ設定",
    color: "#ec4899",
    bg: "#ec489915",
    icon: Settings,
    features: [
      {
        icon: Signature,
        title: "メール署名の自動挿入",
        desc: "設定画面で署名を登録してONにするだけ。生成されたすべてのメール末尾に自動で挿入されます。",
        badge: "NEW",
      },
      {
        icon: Settings,
        title: "プロフィール設定",
        desc: "自分の氏名・会社名・役職・提供サービスを登録。AIがそれを踏まえて送信者視点の文章を生成。",
      },
    ],
  },
  {
    id: "send",
    label: "メール送信",
    color: "#0ea5e9",
    bg: "#0ea5e915",
    icon: Send,
    features: [
      {
        icon: Copy,
        title: "ワンタップでコピー",
        desc: "件名・本文を別々にコピー可能。普段お使いのメールソフトにそのまま貼り付けて送信。",
      },
      {
        icon: Mail,
        title: "Gmail / Outlook / Yahoo 対応",
        desc: "「Gmailで開く」ボタンで件名・本文が入力済みの状態で下書きを開きます。Outlook・Yahooメールにも対応。",
      },
      {
        icon: Clock,
        title: "送信タイミングの把握",
        desc: "送信済みチェックで、誰にまだ送っていないかをダッシュボードから一目で管理できます。",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ backgroundColor: "var(--color-bg)" }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          OREI
        </Link>
        <div className="flex items-center gap-4">
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

      {/* ヒーロー */}
      <section className="px-6 pt-20 pb-16 text-center" style={{ backgroundColor: "#fff" }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, ease: EASE }}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-muted)" }}
          >
            ← トップに戻る
          </Link>
          <h1
            className="font-bold mb-4"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-primary)",
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1.2,
            }}
          >
            全機能一覧
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "var(--color-muted)", lineHeight: 1.8 }}>
            名刺交換からお礼メール送信まで、必要なすべてを1つのアプリに。
          </p>
        </motion.div>

        {/* カテゴリナビ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mt-10"
        >
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.color}30` }}
            >
              <cat.icon size={14} />
              {cat.label}
            </a>
          ))}
        </motion.div>
      </section>

      {/* カテゴリ別機能リスト */}
      <section className="px-6 pb-24" style={{ backgroundColor: "var(--color-bg)" }}>
        <div className="max-w-4xl mx-auto space-y-16">
          {CATEGORIES.map((cat, ci) => (
            <motion.div
              key={cat.id}
              id={cat.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ duration: 0.5, ease: EASE, delay: ci * 0.05 }}
            >
              {/* カテゴリ見出し */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.bg }}
                >
                  <cat.icon size={20} color={cat.color} strokeWidth={1.8} />
                </div>
                <h2
                  className="font-bold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "22px" }}
                >
                  {cat.label}
                </h2>
              </div>

              {/* 機能カード */}
              <div className="grid sm:grid-cols-2 gap-4">
                {cat.features.map((feat, fi) => (
                  <motion.div
                    key={feat.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={VIEWPORT}
                    transition={{ duration: 0.45, ease: EASE, delay: fi * 0.08 }}
                    className="rounded-2xl p-5 flex gap-4"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: cat.bg }}
                    >
                      <feat.icon size={17} color={cat.color} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {feat.title}
                        </p>
                        {feat.badge && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: "#f0faf5", color: "var(--color-accent)" }}
                          >
                            {feat.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                        {feat.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center" style={{ backgroundColor: "var(--color-primary)" }}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          transition={{ duration: 0.5, ease: EASE }}
          className="max-w-2xl mx-auto"
        >
          <h2
            className="font-bold mb-4"
            style={{ fontFamily: "var(--font-heading)", color: "#fff", fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1.3 }}
          >
            まずは無料で試してみる
          </h2>
          <p className="mb-8 text-sm" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.8 }}>
            月5通まで無料 · クレジットカード登録不要 · 2分で完了
          </p>
          <Link href="/signup">
            <Button
              className="h-14 px-12 rounded-xl font-bold text-base shadow-lg"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              無料で始める
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </motion.div>
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
