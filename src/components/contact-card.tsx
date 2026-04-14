"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Contact } from "@/types";

const TAG_COLORS = [
  { bg: "#f0faf5", color: "#3D9E72" },
  { bg: "#eff6ff", color: "#3b82f6" },
  { bg: "#fef3c7", color: "#d97706" },
  { bg: "#fdf2f8", color: "#ec4899" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#fff1f2", color: "#e11d48" },
  { bg: "#f0f9ff", color: "#0284c7" },
];

function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h += tag.charCodeAt(i);
  return TAG_COLORS[h % TAG_COLORS.length];
}

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
          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contact.tags.map((tag) => {
                const c = tagColor(tag);
                return (
                  <span
                    key={tag}
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: c.bg, color: c.color }}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
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
