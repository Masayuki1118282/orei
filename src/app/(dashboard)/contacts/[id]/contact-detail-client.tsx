"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import EmailGenerator from "@/components/email-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Contact } from "@/types";
import UpgradeOfferDialog from "@/components/upgrade-offer-dialog";

type Props = { contact: Contact };

export default function ContactDetailClient({ contact: initialContact }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [contact, setContact] = useState<Contact>(initialContact);
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function toggleSent() {
    const next = !contact.is_sent;
    const { error } = await supabase
      .from("contacts")
      .update({ is_sent: next })
      .eq("id", contact.id);
    if (error) { toast.error("更新に失敗しました"); return; }
    setContact((c) => ({ ...c, is_sent: next }));
    if (next) toast.success("送信済みにしました ✓");
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          ← 一覧
        </button>
        <div className="flex items-center gap-2">
          {contact.is_sent && (
            <Badge style={{ backgroundColor: "#dcfce7", color: "#16a34a", border: "none" }}>
              送信済み
            </Badge>
          )}
          <button
            onClick={() => router.push(`/contacts/${contact.id}/edit`)}
            className="text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{
              border: "1px solid var(--color-accent)",
              color: "var(--color-accent)",
              backgroundColor: "#fff",
            }}
          >
            編集
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* 連絡先情報 */}
        <div
          className="rounded-2xl p-5 shadow-sm mb-6"
          style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text)" }}>
            {contact.name}
          </h2>
          {contact.company && (
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              {contact.company}
              {contact.title && ` / ${contact.title}`}
            </p>
          )}
          <Separator className="my-3" />
          <div className="space-y-1 text-sm" style={{ color: "var(--color-muted)" }}>
            {contact.address && <p>📍 {contact.address}</p>}
            {contact.email && <p>✉ {contact.email}</p>}
            {contact.phone && <p>📞 {contact.phone}</p>}
            {contact.url && (
              <p>
                🌐{" "}
                <a
                  href={contact.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-accent)" }}
                >
                  {contact.url}
                </a>
              </p>
            )}
            {contact.memo && (
              <p className="mt-2 pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                メモ: {contact.memo}
              </p>
            )}
          </div>
          {contact.company_description && (
            <div
              className="mt-3 p-3 rounded-xl text-xs"
              style={{ backgroundColor: "var(--color-bg)", color: "var(--color-muted)" }}
            >
              {contact.company_description}
            </div>
          )}
        </div>

        {/* メール生成 */}
        <EmailGenerator
          contact={contact}
          onUsageLimitExceeded={() => setShowUpgrade(true)}
        />

        {/* 送信済みトグル */}
        <div className="mt-6">
          <Button
            onClick={toggleSent}
            variant="outline"
            className="w-full h-11 rounded-lg"
            style={{
              borderColor: contact.is_sent ? "var(--color-accent)" : "var(--color-border)",
              color: contact.is_sent ? "var(--color-accent)" : "var(--color-muted)",
              backgroundColor: contact.is_sent ? "#f0faf5" : "var(--color-surface)",
            }}
          >
            {contact.is_sent ? "✓ 送信済み（タップで解除）" : "送信できたらチェック ✓"}
          </Button>
        </div>
      </main>

      {/* アップグレードモーダル */}
      <UpgradeOfferDialog open={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
