"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export const WELCOME_DISMISSED_KEY = "orei_welcome_dismissed";

type Props = {
  open: boolean;
  onComplete: () => void;
};

const NOTICES = [
  "生成されたメールは必ず内容を確認してから送信してください",
  "会社情報はAIの推測を含む場合があります",
  "自動送信機能はありません。ご自身のメールアプリから送信してください",
  "名刺データは第三者に提供されません",
  "無料プランは月5通まで（超過後はアップグレードが必要です）",
];

const FEATURES = [
  {
    emoji: "📷",
    title: "名刺表面・裏面のOCR対応",
    desc: "表面と裏面を両方アップロードすると、情報を統合して抽出します。",
  },
  {
    emoji: "💬",
    title: "商談メモでパーソナライズ",
    desc: "連絡先ページで商談内容を入力すると、その内容を踏まえたメールを生成します。",
  },
  {
    emoji: "🗒️",
    title: "メモのタイムライン管理",
    desc: "連絡先ごとに日付付きのメモを追加でき、経緯を時系列で記録できます。",
  },
  {
    emoji: "✍️",
    title: "メール署名の自動挿入",
    desc: "設定画面で署名を登録するだけで、生成されたすべてのメールに自動挿入されます。",
  },
];

export default function WelcomeModal({ open, onComplete }: Props) {
  const supabase = createClient();
  const [step, setStep] = useState<"notices" | "features">("notices");
  const [dontShowAgain, setDontShowAgain] = useState(false);

  async function handleStart() {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, "true");
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ tutorial_completed: true })
        .eq("id", user.id);
    }
    onComplete();
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md rounded-2xl"
        showCloseButton={false}
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {step === "notices" ? (
          <>
            <DialogHeader>
              <DialogTitle
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
              >
                OREIへようこそ
              </DialogTitle>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                ご利用前に以下をご確認ください
              </p>
            </DialogHeader>

            <ul className="space-y-3 my-2">
              {NOTICES.map((notice, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <AlertTriangle
                    size={16}
                    className="mt-0.5 shrink-0"
                    style={{ color: "#f59e0b" }}
                  />
                  <span className="text-sm" style={{ color: "var(--color-text)", lineHeight: "1.6" }}>
                    {notice}
                  </span>
                </li>
              ))}
            </ul>

            {/* モード説明 */}
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>
                2つのモードについて
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">🤝</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      お礼メールモード
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)", lineHeight: "1.6" }}>
                      展示会や商談で名刺交換した相手へ、お礼・関係構築のメールを生成します。
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">📨</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      新規アプローチモード
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)", lineHeight: "1.6" }}>
                      まだ面識のない見込み客へ、初回営業メールを生成します。短文・読みやすさ重視のスタイルです。
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                ※ モードはダッシュボードからいつでも切り替えられます。
              </p>
            </div>

            <Button
              onClick={() => setStep("features")}
              className="w-full h-12 rounded-xl font-semibold mt-2"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              次へ：使える機能を見る →
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle
                className="text-xl font-bold"
                style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
              >
                こんな機能が使えます
              </DialogTitle>
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                名刺交換から送信まで、すべてをサポート
              </p>
            </DialogHeader>

            <ul className="space-y-3 my-2">
              {FEATURES.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl p-3"
                  style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                >
                  <span className="text-lg leading-none mt-0.5 shrink-0">{f.emoji}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {f.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)", lineHeight: "1.6" }}>
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded accent-[#3D9E72] cursor-pointer"
              />
              <span className="text-sm" style={{ color: "var(--color-muted)" }}>
                今後表示しない
              </span>
            </label>

            <Button
              onClick={handleStart}
              className="w-full h-12 rounded-xl font-semibold mt-2"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              理解しました、はじめる →
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
