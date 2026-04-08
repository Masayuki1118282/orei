"use client";

import { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { OcrResult } from "@/types";

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

const EMPTY_FORM: ContactForm = {
  name: "", company: "", address: "", title: "", email: "", phone: "", url: "", memo: "",
  location: "", industry: "",
};

type Props = {
  onNext: (form: ContactForm, imageFile?: File) => void;
};

export default function BusinessCardUploader({ onNext }: Props) {
  const [isMobile] = useState(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateForm(key: keyof ContactForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function compressImage(file: File): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxSize = 1600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("compression failed"));
        }, "image/jpeg", 0.85);
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  }

  async function runOcr(file: File) {
    setOcrLoading(true);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const compressed = await compressImage(file);
      const fd = new FormData();
      fd.append("file", compressed, "image.jpg");
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data: OcrResult = await res.json();
      setForm({
        name: data.name,
        company: data.company,
        address: data.address,
        title: data.title,
        email: data.email,
        phone: data.phone,
        url: data.url,
        memo: "",
        location: "",
        industry: "",
      });
    } catch {
      toast.error("読み取れませんでした。手動で入力してください");
      setActiveTab("manual");
    } finally {
      setOcrLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) runOcr(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) runOcr(file);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("氏名を入力してください");
      return;
    }
    onNext(form, imageFile);
  }

  const showForm = !ocrLoading && (form.name || activeTab === "manual");

  return (
    <div className="w-full max-w-lg mx-auto">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "manual")}>
        <TabsList className="w-full mb-6 rounded-xl" style={{ backgroundColor: "var(--color-border)" }}>
          <TabsTrigger value="camera" className="flex-1 rounded-lg data-[state=active]:shadow-sm">
            撮影・アップロード
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex-1 rounded-lg data-[state=active]:shadow-sm">
            手動入力
          </TabsTrigger>
        </TabsList>

        {/* 撮影・アップロードタブ */}
        <TabsContent value="camera">
          {/* ドロップゾーン */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all mb-4"
            style={{
              border: `2px dashed ${dragging ? "var(--color-accent)" : "var(--color-border)"}`,
              backgroundColor: dragging ? "#f0faf5" : "var(--color-surface)",
              minHeight: "160px",
              padding: "24px",
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="名刺プレビュー"
                className="max-h-40 rounded-lg object-contain"
              />
            ) : (
              <>
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  名刺をドラッグ＆ドロップ
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  {isMobile
                    ? "またはタップして選択（JPEG / PNG / HEIC・最大10MB）"
                    : "スマホで撮影した名刺画像をアップロードしてください"}
                </p>
              </>
            )}
          </div>

          {/* カメラ起動（モバイル向け） */}
          <div className="flex gap-2 mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {isMobile && (
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                id="camera-input"
              />
            )}
            {isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("camera-input")?.click()}
                className="flex-1 h-12 rounded-lg"
                style={{ borderColor: "var(--color-border)" }}
              >
                📷 カメラで撮影
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={`h-12 rounded-lg ${isMobile ? "flex-1" : "w-full"}`}
              style={{ borderColor: "var(--color-border)" }}
            >
              🖼️ 画像を選択
            </Button>
          </div>

          {/* OCRローディング */}
          {ocrLoading && (
            <div className="space-y-3 mb-4">
              <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
                AIが名刺を読み取っています...
              </p>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          )}

          {/* OCR結果フォーム */}
          {showForm && activeTab === "camera" && (
            <ContactFormFields form={form} updateForm={updateForm} onSubmit={handleSubmit} />
          )}
        </TabsContent>

        {/* 手動入力タブ */}
        <TabsContent value="manual">
          <ContactFormFields form={form} updateForm={updateForm} onSubmit={handleSubmit} showLocationIndustry />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// 共通フォームコンポーネント
function ContactFormFields({
  form,
  updateForm,
  onSubmit,
  showLocationIndustry,
}: {
  form: ContactForm;
  updateForm: (key: keyof ContactForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  showLocationIndustry?: boolean;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm font-medium" style={{ color: "var(--color-muted)" }}>
        読み取り結果を確認・修正してください
      </p>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>
          氏名 <span style={{ color: "#ef4444" }}>*</span>
        </Label>
        <Input
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
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
          onChange={(e) => updateForm("company", e.target.value)}
          placeholder="株式会社〇〇"
          className="h-12 rounded-lg"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>所在地</Label>
        <Input
          value={form.address}
          onChange={(e) => updateForm("address", e.target.value)}
          placeholder="例: 愛知県一宮市"
          className="h-12 rounded-lg"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>役職</Label>
        <Input
          value={form.title}
          onChange={(e) => updateForm("title", e.target.value)}
          placeholder="営業部長"
          className="h-12 rounded-lg"
          style={{ fontSize: "16px" }}
        />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>メールアドレス</Label>
        <Input
          value={form.email}
          onChange={(e) => updateForm("email", e.target.value)}
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
          onChange={(e) => updateForm("phone", e.target.value)}
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
          onChange={(e) => updateForm("url", e.target.value)}
          placeholder="https://example.com"
          type="url"
          className="h-12 rounded-lg"
          style={{ fontSize: "16px" }}
        />
      </div>

      {showLocationIndustry && (
        <div className="flex gap-3">
          <div className="space-y-1 flex-1">
            <Label style={{ color: "var(--color-text)" }}>所在地</Label>
            <Input
              value={form.location}
              onChange={(e) => updateForm("location", e.target.value)}
              placeholder="東京都"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>
          <div className="space-y-1 flex-1">
            <Label style={{ color: "var(--color-text)" }}>業種</Label>
            <Input
              value={form.industry}
              onChange={(e) => updateForm("industry", e.target.value)}
              placeholder="IT・SaaS"
              className="h-12 rounded-lg"
              style={{ fontSize: "16px" }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>メモ</Label>
        <Textarea
          value={form.memo}
          onChange={(e) => updateForm("memo", e.target.value)}
          placeholder="展示会で名刺交換。製造業DXに関心あり。"
          className="rounded-lg resize-none"
          rows={3}
          style={{ fontSize: "16px" }}
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-lg font-semibold mt-2"
        style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
      >
        次へ →
      </Button>
    </form>
  );
}
