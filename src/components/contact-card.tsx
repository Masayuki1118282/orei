"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Contact } from "@/types";

type Props = {
  contact: Contact;
  onToggleSent: (id: string, isSent: boolean) => void;
};

export default function ContactCard({ contact, onToggleSent }: Props) {
  return (
    <div
      className="rounded-2xl p-4 shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: "var(--color-surface)",
        border: `1px solid ${contact.is_sent ? "var(--color-accent)" : "var(--color-border)"}`,
        opacity: contact.is_sent ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        {/* 左: 名前・会社・メタ情報 */}
        <Link href={`/contacts/${contact.id}`} className="flex-1 min-w-0">
          <p className="font-semibold truncate" style={{ color: "var(--color-text)" }}>
            {contact.name}
          </p>
          {contact.company && (
            <p className="text-sm truncate mt-0.5" style={{ color: "var(--color-muted)" }}>
              {contact.company}
              {contact.title && ` / ${contact.title}`}
            </p>
          )}
          {contact.email && (
            <p className="text-xs mt-1 truncate" style={{ color: "var(--color-muted)" }}>
              {contact.email}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
            {new Date(contact.created_at).toLocaleDateString("ja-JP")}
          </p>
        </Link>

        {/* 右: 送信済みトグル */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {contact.is_sent && (
            <Badge
              className="text-xs"
              style={{ backgroundColor: "#dcfce7", color: "#16a34a", border: "none" }}
            >
              送信済み
            </Badge>
          )}
          <button
            onClick={() => onToggleSent(contact.id, !contact.is_sent)}
            className="text-xs px-3 py-1.5 rounded-lg transition-all min-h-[36px]"
            style={{
              border: `1px solid ${contact.is_sent ? "var(--color-accent)" : "var(--color-border)"}`,
              backgroundColor: contact.is_sent ? "#f0faf5" : "var(--color-surface)",
              color: contact.is_sent ? "var(--color-accent)" : "var(--color-muted)",
            }}
          >
            {contact.is_sent ? "✓ 送信済み" : "送信済みにする"}
          </button>
        </div>
      </div>
    </div>
  );
}
