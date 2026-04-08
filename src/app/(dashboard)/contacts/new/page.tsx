"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BusinessCardUploader from "@/components/business-card-uploader";
import CompanyConfirmDialog from "@/components/company-confirm-dialog";
import { toast } from "sonner";

type ContactForm = {
  name: string;
  company: string;
  address: string;
  title: string;
  email: string;
  phone: string;
  url: string;
  memo: string;
  location: string;
  industry: string;
};

export default function NewContactPage() {
  const router = useRouter();
  const supabase = createClient();

  const [pendingForm, setPendingForm] = useState<ContactForm | null>(null);
  const [pendingImage, setPendingImage] = useState<File | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // 「次へ」押下時
  function handleNext(form: ContactForm, imageFile?: File) {
    setPendingForm(form);
    setPendingImage(imageFile);

    // 手動入力で所在地/業種が入力された場合は直接 company_description を構築
    const loc = form.location?.trim();
    const ind = form.industry?.trim();
    if (loc || ind) {
      const description = loc && ind ? `${loc}の${ind}の会社` : loc ? `${loc}の会社` : `${ind}の会社`;
      saveContact(form, imageFile, description);
      return;
    }

    // 会社名があればダイアログを開く、なければ直接保存
    if (form.company.trim()) {
      setDialogOpen(true);
    } else {
      saveContact(form, imageFile, null);
    }
  }

  // 会社確認完了後の保存
  async function handleCompanyConfirm(description: string) {
    setDialogOpen(false);
    if (!pendingForm) return;
    await saveContact(pendingForm, pendingImage, description);
  }

  async function saveContact(
    form: ContactForm,
    imageFile: File | undefined,
    companyDescription: string | null
  ) {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // 連絡先を先に作成
      const { data: contact, error: insertError } = await supabase
        .from("contacts")
        .insert({
          user_id: user.id,
          name: form.name,
          company: form.company || null,
          address: form.address || null,
          title: form.title || null,
          email: form.email || null,
          phone: form.phone || null,
          url: form.url || null,
          memo: form.memo || null,
          company_description: companyDescription,
          company_confirmed: !!companyDescription,
        })
        .select()
        .single();

      if (insertError || !contact) {
        throw insertError;
      }

      // 画像アップロード（あれば）
      if (imageFile) {
        const ext = imageFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${contact.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("business-cards")
          .upload(path, imageFile, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("business-cards")
            .getPublicUrl(path);
          await supabase
            .from("contacts")
            .update({ card_image_url: publicUrl })
            .eq("id", contact.id);
        }
      }

      toast.success("連絡先を保存しました");
      router.push(`/contacts/${contact.id}`);
    } catch (error) {
      console.error(error);
      toast.error("保存に失敗しました。もう一度お試しください");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{
          backgroundColor: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="text-sm"
          style={{ color: "var(--color-muted)" }}
        >
          ← 戻る
        </button>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
          名刺を追加
        </h2>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {saving ? (
          <div className="text-center py-16">
            <p style={{ color: "var(--color-muted)" }}>保存中...</p>
          </div>
        ) : (
          <BusinessCardUploader onNext={handleNext} />
        )}
      </main>

      {/* 会社確認ダイアログ */}
      {pendingForm && (
        <CompanyConfirmDialog
          open={dialogOpen}
          company={pendingForm.company}
          url={pendingForm.url}
          onConfirm={handleCompanyConfirm}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
