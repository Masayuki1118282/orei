"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Contact, GeneratedEmail, UseCase } from "@/types";

type EmailResult = {
  subjects: string[];
  bodies: string[];
  followups: { timing: string; body: string }[];
  remainingUsage: number;
  use_case?: UseCase;
};

type Props = {
  contact: Contact;
  initialEmail: GeneratedEmail | null;
  onUsageLimitExceeded: () => void;
};

export default function EmailGenerator({ contact, initialEmail, onUsageLimitExceeded }: Props) {
  const [result, setResult] = useState<EmailResult | null>(
    initialEmail
      ? { subjects: initialEmail.subjects, bodies: initialEmail.bodies, followups: initialEmail.followups, remainingUsage: 0, use_case: initialEmail.use_case }
      : null
  );
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedFollowup, setCopiedFollowup] = useState<number | null>(null);
  const [meetingMemo, setMeetingMemo] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, meetingMemo }),
      });

      if (res.status === 403) {
        onUsageLimitExceeded();
        return;
      }

      if (res.status === 429) {
        toast.error("しばらく待ってから再度お試しください");
        return;
      }

      if (!res.ok) {
        throw new Error();
      }

      const data: EmailResult = await res.json();
      setResult({ ...data, use_case: data.use_case });
      setSelectedIndex(0);
    } catch {
      toast.error("生成に失敗しました。もう一度お試しください");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string, type: "subject" | "body" | "followup", idx?: number) {
    await navigator.clipboard.writeText(text);
    if (type === "subject") {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 1500);
    } else if (type === "body") {
      setCopiedBody(true);
      setTimeout(() => setCopiedBody(false), 1500);
    } else if (type === "followup" && idx !== undefined) {
      setCopiedFollowup(idx);
      setTimeout(() => setCopiedFollowup(null), 1500);
    }
  }

  function getMailParams(subjectIdx: number, bodyIdx: number) {
    const to = contact.email ? encodeURIComponent(contact.email) : "";
    const subject = encodeURIComponent(result!.subjects[subjectIdx]);
    const body = encodeURIComponent(result!.bodies[bodyIdx]);
    return { to, subject, body };
  }

  function openMailClient(client: "gmail" | "outlook" | "yahoo" | "mailto", subjectIdx: number, bodyIdx: number) {
    const { to, subject, body } = getMailParams(subjectIdx, bodyIdx);
    let url = "";
    switch (client) {
      case "gmail":
        url = `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`;
        break;
      case "outlook":
        url = `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;
        break;
      case "yahoo":
        url = `https://compose.mail.yahoo.co.jp/?to=${to}&subject=${subject}&body=${body}`;
        break;
      case "mailto":
        url = `mailto:${to}?subject=${subject}&body=${body}`;
        break;
    }
    window.open(url, "_blank");
  }

  // ローディング中スケルトン
  if (loading) {
    return (
      <div className="space-y-4 mt-6">
        <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
          AIがメールを生成しています...
        </p>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-lg" />
        ))}
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  // 生成前
  if (!result) {
    return (
      <div className="mt-6 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
            商談・会話の内容（任意）
          </label>
          <textarea
            value={meetingMemo}
            onChange={(e) => setMeetingMemo(e.target.value)}
            placeholder="例: 製造業のDX推進に関心あり。来月の展示会でデモを見たいとのこと。"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-bg)",
              color: "var(--color-text)",
              fontSize: "16px",
            }}
          />
        </div>
        <Button
          onClick={generate}
          className="w-full h-14 rounded-xl font-semibold text-base"
          style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
        >
          メールを生成する
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* 残り使用回数 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
            生成完了
          </p>
          <Badge style={{
            backgroundColor: result.use_case === "cold_dm" ? "#eff6ff" : "#f0faf5",
            color: result.use_case === "cold_dm" ? "#1d4ed8" : "var(--color-accent)",
            border: "none",
          }}>
            {result.use_case === "cold_dm" ? "新規アプローチ" : "挨拶メール"}
          </Badge>
        </div>
        {result.remainingUsage > 0 && (
          <Badge variant="outline" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
            今月あと {result.remainingUsage} 通使えます
          </Badge>
        )}
      </div>

      {/* 案切り替えタブ */}
      <Tabs value={String(selectedIndex)} onValueChange={(v) => setSelectedIndex(Number(v))}>
        <TabsList className="w-full rounded-xl" style={{ backgroundColor: "var(--color-border)" }}>
          {result.subjects.map((_, i) => (
            <TabsTrigger key={i} value={String(i)} className="flex-1 rounded-lg">
              案 {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {result.subjects.map((subject, i) => (
          <TabsContent key={i} value={String(i)} className="space-y-4 mt-4">
            {/* 件名 */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>件名</p>
                <button
                  onClick={() => copyText(subject, "subject")}
                  className="text-xs px-3 py-1 rounded-lg transition-colors"
                  style={{
                    backgroundColor: copiedSubject ? "#dcfce7" : "var(--color-surface)",
                    color: copiedSubject ? "#16a34a" : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {copiedSubject ? "コピーしました ✓" : "コピー"}
                </button>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                {subject}
              </p>
            </div>

            {/* 本文 */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "var(--color-muted)" }}>本文</p>
                <button
                  onClick={() => copyText(result.bodies[i], "body")}
                  className="text-xs px-3 py-1 rounded-lg transition-colors"
                  style={{
                    backgroundColor: copiedBody ? "#dcfce7" : "var(--color-surface)",
                    color: copiedBody ? "#16a34a" : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {copiedBody ? "コピーしました ✓" : "コピー"}
                </button>
              </div>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: "var(--color-text)", lineHeight: "1.8" }}
              >
                {result.bodies[i]}
              </p>
            </div>

            {/* メールクライアント選択 */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="w-full h-11 rounded-lg text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: "transparent",
                }}
              >
                📧 メールを開く ▾
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" side="bottom" align="center">
                <DropdownMenuItem onClick={() => openMailClient("gmail", i, i)}>
                  📧 Gmailで開く
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openMailClient("outlook", i, i)}>
                  📧 Outlookで開く
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openMailClient("yahoo", i, i)}>
                  📧 Yahoo!メールで開く
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openMailClient("mailto", i, i)}>
                  📧 その他メールアプリ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsContent>
        ))}
      </Tabs>

      {/* フォローアップ */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          フォローアップ
        </p>
        <div className="space-y-3">
          {result.followups.map((f, i) => (
            <div
              key={i}
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs" style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
                  {f.timing}
                </Badge>
                <button
                  onClick={() => copyText(f.body, "followup", i)}
                  className="text-xs px-3 py-1 rounded-lg transition-colors"
                  style={{
                    backgroundColor: copiedFollowup === i ? "#dcfce7" : "var(--color-surface)",
                    color: copiedFollowup === i ? "#16a34a" : "var(--color-muted)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {copiedFollowup === i ? "コピーしました ✓" : "コピー"}
                </button>
              </div>
              <p
                className="text-sm whitespace-pre-wrap"
                style={{ color: "var(--color-text)", lineHeight: "1.8" }}
              >
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 再生成ボタン */}
      <Button
        onClick={generate}
        variant="outline"
        className="w-full h-11 rounded-lg"
        style={{ borderColor: "var(--color-border)" }}
      >
        別のパターンを生成する
      </Button>
    </div>
  );
}
