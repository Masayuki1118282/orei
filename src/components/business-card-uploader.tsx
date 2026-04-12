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

// ── QRコード読み取り ────────────────────────────────────────
async function scanQrCode(file: File | Blob): Promise<string | null> {
  // 1) BarcodeDetector（iOS 17+ / Chrome Android）— EXIF・角度・実写真に強い
  if (typeof window !== "undefined" && "BarcodeDetector" in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      const bitmap = await createImageBitmap(file);
      const codes: { rawValue: string }[] = await detector.detect(bitmap);
      bitmap.close();
      if (codes.length > 0) return codes[0].rawValue;
    } catch {
      // BarcodeDetector 失敗 → jsQR にフォールバック
    }
  }

  // 2) jsQR フォールバック（複数スケール＋4方向回転）
  try {
    const jsQR = (await import("jsqr")).default;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    function tryScan(w: number, h: number, draw: () => void) {
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      draw();
      return jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
    }

    // 元サイズ
    let result = tryScan(img.width, img.height, () => ctx.drawImage(img, 0, 0));
    if (result) return result.data;

    // 長辺 1600px に縮小
    const maxSide = 1600;
    if (Math.max(img.width, img.height) > maxSide) {
      const scale = maxSide / Math.max(img.width, img.height);
      const w2 = Math.round(img.width * scale);
      const h2 = Math.round(img.height * scale);
      result = tryScan(w2, h2, () => ctx.drawImage(img, 0, 0, w2, h2));
      if (result) return result.data;
    }

    // 90° / 180° / 270° 回転（EXIF 未適用の保険）
    for (const angle of [Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const swap = angle === Math.PI / 2 || angle === (3 * Math.PI) / 2;
      const rw = swap ? img.height : img.width;
      const rh = swap ? img.width : img.height;
      result = tryScan(rw, rh, () => {
        ctx.save();
        ctx.translate(rw / 2, rh / 2);
        ctx.rotate(angle);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();
      });
      if (result) return result.data;
    }

    return null;
  } catch {
    return null;
  }
}

// ── vCard パーサー ──────────────────────────────────────────
type QrFill = Partial<Pick<ContactForm, "name" | "company" | "title" | "email" | "phone" | "url">>;

function parseVCard(raw: string): QrFill {
  const lines = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const get = (prefix: string) =>
    lines.find((l) => l.toUpperCase().startsWith(prefix))?.split(":").slice(1).join(":").trim() ?? "";

  // N:姓;名;;; → "姓 名"
  const nLine = get("N:");
  const nameParts = nLine ? nLine.split(";").filter(Boolean) : [];
  const nameFromN = nameParts.length >= 2 ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0] ?? "";
  const nameFromFN = get("FN:");
  const name = (nameFromFN || nameFromN).trim();

  return {
    name: name || undefined,
    company: get("ORG:") || undefined,
    title: get("TITLE:") || undefined,
    email: get("EMAIL") || undefined,   // EMAIL;TYPE=... にも対応
    phone: get("TEL") || undefined,     // TEL;TYPE=... にも対応
    url: get("URL:") || undefined,
  };
}

function parseQrContent(raw: string): { type: "vcard"; fill: QrFill } | { type: "url"; url: string } | null {
  const trimmed = raw.trim();
  if (trimmed.toUpperCase().includes("BEGIN:VCARD")) {
    return { type: "vcard", fill: parseVCard(trimmed) };
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return { type: "url", url: trimmed };
  }
  return null;
}

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
  const [cardFaceTab, setCardFaceTab] = useState<"front" | "back">("front");
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [scanPending, setScanPending] = useState(false);
  const [frontFile, setFrontFile] = useState<File | undefined>();
  const [backFile, setBackFile] = useState<File | undefined>();
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);

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

  async function runOcr() {
    if (!frontFile && !backFile) return;
    setScanPending(false);
    setOcrLoading(true);
    try {
      const fd = new FormData();
      let compressedFront: Blob | undefined;
      let compressedBack: Blob | undefined;
      if (frontFile) {
        compressedFront = await compressImage(frontFile);
        fd.append("frontImage", compressedFront, "front.jpg");
      }
      if (backFile) {
        compressedBack = await compressImage(backFile);
        fd.append("backImage", compressedBack, "back.jpg");
      }

      // OCR と QRスキャン（EXIF補正済み圧縮画像を使用）を並行実行
      const [ocrRes, qrFront, qrBack] = await Promise.all([
        fetch("/api/ocr", { method: "POST", body: fd }),
        compressedFront ? scanQrCode(compressedFront) : Promise.resolve(null),
        compressedBack ? scanQrCode(compressedBack) : Promise.resolve(null),
      ]);
      if (!ocrRes.ok) throw new Error();
      const data: OcrResult = await ocrRes.json();

      const qrRaw = qrFront ?? qrBack;
      // DEBUG: QRスキャン結果を表示（確認後削除）
      const bdAvail = typeof window !== "undefined" && "BarcodeDetector" in window;
      toast.info(`BD:${bdAvail ? "○" : "×"} 表:${qrFront ?? "なし"} 裏:${qrBack ?? "なし"}`, { duration: 10000 });
      const qrParsed = qrRaw ? parseQrContent(qrRaw) : null;

      const base: ContactForm = {
        name: data.name, company: data.company, address: data.address,
        title: data.title, email: data.email, phone: data.phone,
        url: data.url, memo: data.memo ?? "", location: "", industry: "",
      };
      if (qrParsed?.type === "vcard") {
        const f = qrParsed.fill;
        if (f.name) base.name = f.name;
        if (f.company) base.company = f.company;
        if (f.title) base.title = f.title;
        if (f.email) base.email = f.email;
        if (f.phone) base.phone = f.phone;
        if (f.url) base.url = f.url;
        toast.success("QRコードを読み取り、連絡先情報を補完しました");
      } else if (qrParsed?.type === "url") {
        base.url = qrParsed.url;
        toast.success("QRコードからURLを取得しました");
      }
      setForm(base);
    } catch {
      toast.error("読み取れませんでした。手動で入力してください");
      setActiveTab("manual");
    } finally {
      setOcrLoading(false);
    }
  }

  function handleFrontFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    setFrontPreviewUrl(URL.createObjectURL(file));
    setScanPending(true);
    setForm(EMPTY_FORM);
  }

  function handleBackFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    setBackPreviewUrl(URL.createObjectURL(file));
    setScanPending(true);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (cardFaceTab === "front") {
      setFrontFile(file);
      setFrontPreviewUrl(URL.createObjectURL(file));
      setForm(EMPTY_FORM);
    } else {
      setBackFile(file);
      setBackPreviewUrl(URL.createObjectURL(file));
    }
    setScanPending(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardFaceTab]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("氏名を入力してください");
      return;
    }
    onNext(form, frontFile);
  }

  const currentPreviewUrl = cardFaceTab === "front" ? frontPreviewUrl : backPreviewUrl;
  const showScanButton = scanPending && !ocrLoading;
  const showBackHint = showScanButton && !!frontFile && !backFile;
  const showForm = !ocrLoading && !scanPending && (!!form.name || activeTab === "manual");

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
          {/* 表面 / 裏面 サブタブ */}
          <div className="flex rounded-xl overflow-hidden mb-4" style={{ border: "1px solid var(--color-border)" }}>
            {(["front", "back"] as const).map((face) => (
              <button
                key={face}
                type="button"
                onClick={() => setCardFaceTab(face)}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: cardFaceTab === face ? "var(--color-accent)" : "var(--color-surface)",
                  color: cardFaceTab === face ? "#fff" : "var(--color-muted)",
                }}
              >
                {face === "front" ? "表面" : "裏面"}
                {face === "front" && frontFile && " ✓"}
                {face === "back" && backFile && " ✓"}
              </button>
            ))}
          </div>

          {/* ドロップゾーン */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => cardFaceTab === "front" ? frontFileInputRef.current?.click() : backFileInputRef.current?.click()}
            className="relative rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all mb-4"
            style={{
              border: `2px dashed ${dragging ? "var(--color-accent)" : "var(--color-border)"}`,
              backgroundColor: dragging ? "#f0faf5" : "var(--color-surface)",
              minHeight: "160px",
              padding: "24px",
            }}
          >
            {currentPreviewUrl ? (
              <img src={currentPreviewUrl} alt="名刺プレビュー" className="max-h-40 rounded-lg object-contain" />
            ) : (
              <>
                <div className="text-3xl mb-2">📷</div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  名刺{cardFaceTab === "front" ? "表面" : "裏面"}をドラッグ＆ドロップ
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                  {isMobile ? "またはタップして選択" : "スマホで撮影した名刺画像をアップロード"}
                </p>
              </>
            )}
          </div>

          {/* ファイル入力（表面） */}
          <input ref={frontFileInputRef} type="file" accept="image/*" onChange={handleFrontFileChange} className="hidden" />
          <input ref={frontCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFrontFileChange} className="hidden" />
          {/* ファイル入力（裏面） */}
          <input ref={backFileInputRef} type="file" accept="image/*" onChange={handleBackFileChange} className="hidden" />
          <input ref={backCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleBackFileChange} className="hidden" />

          <div className="flex gap-2 mb-6">
            {isMobile && (
              <Button
                type="button"
                variant="outline"
                onClick={() => cardFaceTab === "front" ? frontCameraInputRef.current?.click() : backCameraInputRef.current?.click()}
                className="flex-1 h-12 rounded-lg"
                style={{ borderColor: "var(--color-border)" }}
              >
                📷 カメラで撮影
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => cardFaceTab === "front" ? frontFileInputRef.current?.click() : backFileInputRef.current?.click()}
              className={`h-12 rounded-lg ${isMobile ? "flex-1" : "w-full"}`}
              style={{ borderColor: "var(--color-border)" }}
            >
              🖼️ 画像を選択
            </Button>
          </div>

          {/* 読み取りボタン + ヒント */}
          {showScanButton && (
            <div className="mb-4">
              {showBackHint && (
                <p className="text-xs mb-3 px-1 leading-relaxed" style={{ color: "var(--color-muted)" }}>
                  このまま読み取れます。裏面もある場合は「裏面」タブからアップロードすると、より多くの情報を取得できます。表面のみの場合はそのまま読み取りを進めてください。
                </p>
              )}
              <Button
                type="button"
                onClick={runOcr}
                className="w-full h-12 rounded-lg font-semibold"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              >
                名刺を読み取る
              </Button>
            </div>
          )}

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
        <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="山田 花子" className="h-12 rounded-lg" style={{ fontSize: "16px" }} required />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>会社名</Label>
        <Input value={form.company} onChange={(e) => updateForm("company", e.target.value)} placeholder="株式会社〇〇" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>所在地</Label>
        <Input value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="例: 愛知県一宮市" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>役職</Label>
        <Input value={form.title} onChange={(e) => updateForm("title", e.target.value)} placeholder="営業部長" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>メールアドレス</Label>
        <Input value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="hanako@example.com" type="email" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>電話番号</Label>
        <Input value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="03-1234-5678" type="tel" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
      </div>

      <div className="space-y-1">
        <Label style={{ color: "var(--color-text)" }}>会社URL</Label>
        <Input value={form.url} onChange={(e) => updateForm("url", e.target.value)} placeholder="https://example.com" type="url" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
      </div>

      {showLocationIndustry && (
        <div className="flex gap-3">
          <div className="space-y-1 flex-1">
            <Label style={{ color: "var(--color-text)" }}>所在地</Label>
            <Input value={form.location} onChange={(e) => updateForm("location", e.target.value)} placeholder="東京都" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
          </div>
          <div className="space-y-1 flex-1">
            <Label style={{ color: "var(--color-text)" }}>業種</Label>
            <Input value={form.industry} onChange={(e) => updateForm("industry", e.target.value)} placeholder="IT・SaaS" className="h-12 rounded-lg" style={{ fontSize: "16px" }} />
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

      <Button type="submit" className="w-full h-12 rounded-lg font-semibold mt-2" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
        次へ →
      </Button>
    </form>
  );
}
