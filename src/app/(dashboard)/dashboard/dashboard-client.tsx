"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ContactCard from "@/components/contact-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Contact, PlanType, UseCase } from "@/types";
import UpgradeOfferDialog from "@/components/upgrade-offer-dialog";
import WelcomeModal, { WELCOME_DISMISSED_KEY } from "@/components/welcome-modal";
import "driver.js/dist/driver.css";

type Props = {
  contacts: Contact[];
  remaining: number;
  limit: number;
  plan: PlanType;
  useCase: UseCase;
  userName: string;
  tutorialCompleted: boolean;
  showUpgradeSuccess?: boolean;
};

const TOUR_KEY = "orei_tour_completed";

async function startTour() {
  if (localStorage.getItem(TOUR_KEY)) return;
  const mod = await import("driver.js");
  const driver = mod.driver;
  const driverObj = driver({
    animate: true,
    overlayOpacity: 0.5,
    popoverClass: "orei-driver-popover",
    nextBtnText: "次へ →",
    prevBtnText: "← 戻る",
    doneBtnText: "完了",
    steps: [
      {
        element: "#add-contact-btn",
        popover: {
          title: "まずここから",
          description:
            "名刺を撮影するか、手動で相手の情報を入力してください。スマホで撮影した写真をアップロードするとOCRで自動入力されます。",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#usage-banner",
        popover: {
          title: "使用量の確認",
          description:
            "無料プランは月5通まで。上限に達したら特別オファーが表示されます。",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: "#contacts-list",
        popover: {
          title: "連絡先をクリックしてメール生成",
          description:
            "保存した連絡先をクリックすると、件名3案・本文3案・フォローアップが一括で生成されます。",
          side: "top",
          align: "center",
        },
      },
    ],
    onDestroyStarted: () => {
      localStorage.setItem(TOUR_KEY, "true");
      driverObj.destroy();
    },
  });
  driverObj.drive();
}

export default function DashboardClient({ contacts: initialContacts, remaining, limit, plan, useCase: initialUseCase, userName, tutorialCompleted, showUpgradeSuccess }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const syncedRef = useRef(false);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [offerOpen, setOfferOpen] = useState(false);
  const [useCase, setUseCase] = useState<UseCase>(initialUseCase);
  const [modeChanging, setModeChanging] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => {
    if (tutorialCompleted) return false;
    if (typeof window !== "undefined" && localStorage.getItem(WELCOME_DISMISSED_KEY) === "true") return false;
    return true;
  });

  async function handleToggleMode() {
    const next: UseCase = useCase === "thank_you" ? "cold_dm" : "thank_you";
    setModeChanging(true);
    const { error } = await supabase
      .from("profiles")
      .update({ use_case: next })
      .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
    if (!error) setUseCase(next);
    setModeChanging(false);
  }

  // 決済完了後のトースト表示（同期はサーバーサイドで完了済み）
  useEffect(() => {
    if (!showUpgradeSuccess || syncedRef.current) return;
    syncedRef.current = true;
    toast.success("PERSONALプランへのアップグレードが完了しました 🎉");
    router.replace("/dashboard");
  }, [showUpgradeSuccess, router]);

  // 無料枠を使い切ったら必ずポップアップを表示（過去の dismissal フラグをリセット）
  useEffect(() => {
    if (remaining === 0 && plan === "free") {
      localStorage.removeItem("orei_offer_dismissed");
      const t = setTimeout(() => setOfferOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [remaining, plan]);

  async function handleToggleSent(id: string, isSent: boolean) {
    const { error } = await supabase
      .from("contacts")
      .update({ is_sent: isSent })
      .eq("id", id);

    if (error) {
      toast.error("更新に失敗しました");
      return;
    }
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_sent: isSent } : c))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("この連絡先を削除しますか？")) return;
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (error) {
      toast.error("削除に失敗しました");
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("削除しました");
  }

  const usedCount = limit - remaining;
  const usagePercent = Math.min(100, (usedCount / limit) * 100);
  const sentContacts = contacts.filter((c) => c.is_sent);
  const unsentContacts = contacts.filter((c) => !c.is_sent);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <WelcomeModal
        open={welcomeOpen}
        onComplete={() => {
          setWelcomeOpen(false);
          startTour();
        }}
      />
      <UpgradeOfferDialog open={offerOpen} onClose={() => setOfferOpen(false)} />
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          OREI
        </h1>
        <div className="flex items-center gap-3">
          {plan === "free" && (
            <Link href="/settings#plan">
              <Badge
                className="text-xs cursor-pointer"
                style={{ backgroundColor: "#fef9c3", color: "#854d0e", border: "none" }}
              >
                FREE
              </Badge>
            </Link>
          )}
          {(plan === "personal_monthly" || plan === "personal_yearly") && (
            <Badge
              className="text-xs"
              style={{ backgroundColor: "#f0faf5", color: "var(--color-accent)", border: "none" }}
            >
              {plan === "personal_yearly" ? "PERSONAL 年額" : "PERSONAL"}
            </Badge>
          )}
          <Link href="/settings" className="text-sm" style={{ color: "var(--color-muted)" }}>
            設定
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* 使用量バナー */}
        <div
          id="usage-banner"
          className="rounded-2xl p-4 mb-6 shadow-sm"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              今月あと <strong style={{ color: "var(--color-accent)", fontSize: "1.1em" }}>{remaining}</strong> 通使えます
            </p>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              {usedCount} / {limit} 通
            </p>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${usagePercent}%`,
                backgroundColor: remaining <= 1 ? "#ef4444" : "var(--color-accent)",
              }}
            />
          </div>
          {remaining === 0 && (
            <Link href="/settings#plan">
              <Button
                className="w-full mt-3 h-10 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
              >
                プランをアップグレード →
              </Button>
            </Link>
          )}
        </div>

        {/* モード切替 */}
        <div
          className="rounded-2xl p-4 mb-6 shadow-sm flex items-center justify-between"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
              {useCase === "thank_you" ? "🤝 お礼メールモード" : "📨 新規アプローチモード"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>
              {useCase === "thank_you"
                ? "名刺交換後の関係構築メールを生成"
                : "まだ面識のない見込み客への新規アプローチメールを生成"}
            </p>
          </div>
          <button
            onClick={handleToggleMode}
            disabled={modeChanging}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity"
            style={{
              backgroundColor: "var(--color-bg)",
              color: "var(--color-muted)",
              border: "1px solid var(--color-border)",
              opacity: modeChanging ? 0.5 : 1,
            }}
          >
            切替
          </button>
        </div>

        {/* 新規追加ボタン */}
        <Link href="/contacts/new" id="add-contact-btn">
          <Button
            className="w-full h-14 rounded-xl font-semibold text-base mb-6 shadow-sm"
            style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
          >
            + 名刺を追加してメールを生成
          </Button>
        </Link>

        {/* 連絡先一覧 */}
        <div id="contacts-list">
        {contacts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📇</div>
            <p className="font-medium" style={{ color: "var(--color-text)" }}>
              まだ連絡先がありません
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
              名刺を追加してお礼メールを生成しましょう
            </p>
          </div>
        ) : (
          <>
            {/* 未送信 */}
            {unsentContacts.length > 0 && (
              <section className="mb-6">
                <p className="text-xs font-medium mb-3" style={{ color: "var(--color-muted)" }}>
                  未送信 ({unsentContacts.length})
                </p>
                <div className="space-y-3">
                  {unsentContacts.map((contact) => (
                    <div key={contact.id} className="relative group">
                      <ContactCard contact={contact} onToggleSent={handleToggleSent} />
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="absolute top-3 right-32 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded"
                        style={{ color: "#ef4444" }}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 送信済み */}
            {sentContacts.length > 0 && (
              <>
                {unsentContacts.length > 0 && <Separator className="mb-6" />}
                <section>
                  <p className="text-xs font-medium mb-3" style={{ color: "var(--color-muted)" }}>
                    送信済み ({sentContacts.length})
                  </p>
                  <div className="space-y-3">
                    {sentContacts.map((contact) => (
                      <div key={contact.id} className="relative group">
                        <ContactCard contact={contact} onToggleSent={handleToggleSent} />
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="absolute top-3 right-32 text-xs opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded"
                          style={{ color: "#ef4444" }}
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
