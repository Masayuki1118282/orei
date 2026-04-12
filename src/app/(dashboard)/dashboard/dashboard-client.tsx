"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { Search, ArrowUpDown, Download } from "lucide-react";
import "driver.js/dist/driver.css";

type SortKey = "created_at" | "company" | "name";
type SortDir = "asc" | "desc";

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
            "名刺を撮影するか、手動で相手の情報を入力してください。表面・裏面の両方をアップロードすると、情報を統合して自動入力されます。",
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
            "保存した連絡先をクリックすると詳細ページへ。商談メモを入力してからメール生成すると、その内容を踏まえたパーソナルな文章が生成されます。",
          side: "top",
          align: "center",
        },
      },
      {
        element: "#mode-toggle-btn",
        popover: {
          title: "2つのモードを切り替え",
          description:
            "「挨拶メール」は名刺交換後のお礼メール、「新規アプローチ」はまだ面識のない相手への初回営業メールを生成します。",
          side: "bottom",
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
  const syncedRef = useRef(false);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [offerOpen, setOfferOpen] = useState(false);
  const [useCase, setUseCase] = useState<UseCase>(initialUseCase);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [sentFilter, setSentFilter] = useState<"all" | "unsent" | "sent">("all");
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

  // 決済完了後のトースト表示（URLだけ静かに変える、サーバー再レンダリングしない）
  useEffect(() => {
    if (!showUpgradeSuccess || syncedRef.current) return;
    syncedRef.current = true;
    toast.success("PERSONALプランへのアップグレードが完了しました 🎉");
    window.history.replaceState({}, "", "/dashboard");
  }, [showUpgradeSuccess]);

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

  function handleExportCSV() {
    const escape = (v: string | null | undefined) => {
      const s = v ?? "";
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };
    const headers = ["氏名", "会社名", "役職", "メール", "電話", "URL", "登録日"];
    const rows = contacts.map((c) => [
      escape(c.name),
      escape(c.company),
      escape(c.title),
      escape(c.email),
      escape(c.phone),
      escape(c.url),
      escape(c.created_at ? c.created_at.slice(0, 10) : ""),
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orei_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = q
      ? contacts.filter((c) =>
          [c.name, c.company, c.title, c.email].some((v) =>
            v?.toLowerCase().includes(q)
          )
        )
      : contacts;

    if (sentFilter === "unsent") result = result.filter((c) => !c.is_sent);
    else if (sentFilter === "sent") result = result.filter((c) => c.is_sent);

    result = [...result].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      if (sortKey === "company") {
        aVal = a.company ?? "";
        bVal = b.company ?? "";
      } else if (sortKey === "name") {
        aVal = a.name ?? "";
        bVal = b.name ?? "";
      } else {
        aVal = a.created_at;
        bVal = b.created_at;
      }
      const cmp = aVal.localeCompare(bVal, "ja");
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [contacts, searchQuery, sortKey, sortDir, sentFilter]);

  const sentContacts = filteredContacts.filter((c) => c.is_sent);
  const unsentContacts = filteredContacts.filter((c) => !c.is_sent);

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
        <Image src="/images/logo.svg" alt="OREI" width={94} height={29} priority />
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
          id="mode-toggle-btn"
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

        {/* 検索・ソート */}
        {contacts.length > 0 && (
          <div className="mb-4 space-y-2">
            {/* 検索 */}
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-muted)" }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="氏名・会社名・役職・メールで検索"
                className="w-full h-10 pl-9 pr-4 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "16px",
                }}
              />
            </div>
            {/* 送信フィルタータブ */}
            <div className="flex items-center gap-1.5">
              {(
                [
                  { key: "all", label: `全て (${contacts.length})` },
                  { key: "unsent", label: `未送信 (${contacts.filter((c) => !c.is_sent).length})` },
                  { key: "sent", label: `送信済み (${contacts.filter((c) => c.is_sent).length})` },
                ] as { key: "all" | "unsent" | "sent"; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSentFilter(key)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor: sentFilter === key ? "var(--color-primary)" : "var(--color-surface)",
                    color: sentFilter === key ? "#fff" : "var(--color-muted)",
                    border: `1px solid ${sentFilter === key ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* ソートボタン + CSVエクスポート */}
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: "var(--color-muted)" }}>並び替え：</span>
              {(
                [
                  { key: "created_at", label: "登録日" },
                  { key: "company", label: "会社名" },
                  { key: "name", label: "氏名" },
                ] as { key: SortKey; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all"
                  style={{
                    backgroundColor: sortKey === key ? "var(--color-primary)" : "var(--color-surface)",
                    color: sortKey === key ? "#fff" : "var(--color-muted)",
                    border: `1px solid ${sortKey === key ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  <ArrowUpDown size={11} />
                  {label}
                  {sortKey === key && (sortDir === "asc" ? " ↑" : " ↓")}
                </button>
              ))}
              </div>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-70"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-muted)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <Download size={11} />
                CSV
              </button>
            </div>
          </div>
        )}

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
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🔍</div>
            <p className="font-medium" style={{ color: "var(--color-text)" }}>
              「{searchQuery}」に一致する連絡先がありません
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm mt-2"
              style={{ color: "var(--color-accent)" }}
            >
              検索をクリア
            </button>
          </div>
        ) : (
          <>
            {sentFilter === "all" ? (
              /* 全て表示 — セクション分けなし */
              <div className="space-y-3">
                {filteredContacts.map((contact) => (
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
                              className="absolute top-3 right-32 text-xs sm:opacity-0 sm:group-hover:opacity-100 transition-opacity px-2 py-1 rounded"
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
          </>
        )}
        </div>
      </main>
    </div>
  );
}
