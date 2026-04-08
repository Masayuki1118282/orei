"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Contact } from "@/types";

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    address: "",
    title: "",
    email: "",
    phone: "",
    url: "",
    memo: "",
  });

  useEffect(() => {
    async function fetchContact() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (!data) { router.push("/dashboard"); return; }

      const contact = data as Contact;
      setForm({
        name: contact.name ?? "",
        company: contact.company ?? "",
        address: contact.address ?? "",
        title: contact.title ?? "",
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        url: contact.url ?? "",
        memo: contact.memo ?? "",
      });
      setLoading(false);
    }
    fetchContact();
  }, [id]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("氏名を入力してください");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("contacts")
      .update({
        name: form.name,
        company: form.company || null,
        address: form.address || null,
        title: form.title || null,
        email: form.email || null,
        phone: form.phone || null,
        url: form.url || null,
        memo: form.memo || null,
      })
      .eq("id", id);

    if (error) {
      toast.error("保存に失敗しました");
      setSaving(false);
      return;
    }
    toast.success("保存しました");
    router.push(`/contacts/${id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg)" }}>
        <p style={{ color: "var(--color-muted)" }}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => router.push(`/contacts/${id}`)}
          className="text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          ← 戻る
        </button>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          連絡先を編集
        </h2>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>
              氏名 <span style={{ color: "#ef4444" }}>*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="山田 花子"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
              required
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>会社名</Label>
            <Input
              value={form.company}
              onChange={(e) => update("company", e.target.value)}
              placeholder="株式会社〇〇"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>所在地</Label>
            <Input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="例: 愛知県一宮市"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>役職</Label>
            <Input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="営業部長"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>メールアドレス</Label>
            <Input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="hanako@example.com"
              type="email"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>電話番号</Label>
            <Input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="03-1234-5678"
              type="tel"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>会社URL</Label>
            <Input
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://example.com"
              type="url"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="space-y-1">
            <Label style={{ color: "var(--color-text)" }}>メモ</Label>
            <Textarea
              value={form.memo}
              onChange={(e) => update("memo", e.target.value)}
              placeholder="展示会で名刺交換。製造業DXに関心あり。"
              className="rounded-lg resize-none"
              rows={3}
              style={{ fontSize: "16px" }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/contacts/${id}`)}
              className="flex-1 h-12 rounded-lg"
              style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-lg font-semibold"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              {saving ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
