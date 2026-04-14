"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Contact } from "@/types";
import { toast } from "sonner";

type Step = "upload" | "preview" | "importing" | "done";
type DuplicateAction = "overwrite" | "skip" | "keep_both";

interface ParsedContact {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  url: string;
  memo: string;
}

interface ParseResult {
  contacts: ParsedContact[];
  skippedCount: number;
  skippedNames: string[];
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
}

type Props = {
  open: boolean;
  onClose: () => void;
  existingContacts: Contact[];
  onImported: (newContacts: Contact[]) => void;
};

function parseCSVText(text: string): string[][] {
  // Strip BOM if present
  const clean = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field.trim());
        field = "";
      } else if (char === "\n") {
        row.push(field.trim());
        if (row.some((f) => f !== "")) rows.push(row);
        row = [];
        field = "";
      } else if (char === "\r") {
        // skip
      } else {
        field += char;
      }
    }
  }

  if (row.length > 0) {
    row.push(field.trim());
    if (row.some((f) => f !== "")) rows.push(row);
  }

  return rows;
}

function parseEightCSV(text: string): ParseResult {
  const rows = parseCSVText(text);
  if (rows.length < 2) return { contacts: [], skippedCount: 0, skippedNames: [] };

  const header = rows[0];
  const find = (keywords: string[]) =>
    header.findIndex((h) => keywords.some((k) => h.includes(k)));

  const idx = {
    company: find(["会社名"]),
    department: find(["部署名"]),
    title: find(["役職"]),
    name: find(["氏名"]),
    email: find(["e-mail", "E-mail", "email", "Email"]),
    address: find(["住所"]),
    telCompany: find(["TEL会社"]),
    telDirect: find(["TEL直通"]),
    url: find(["URL"]),
    exchangeDate: find(["名刺交換日"]),
    reprocessing: find(["再データ化"]),
    uncertain: find(["?", "？"]),
  };

  const contacts: ParsedContact[] = [];
  const skippedNames: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const get = (colIdx: number) => (colIdx >= 0 ? row[colIdx] ?? "" : "");

    // Skip 再データ化中 or ?含むデータ
    if (get(idx.reprocessing) !== "" || get(idx.uncertain) !== "") {
      const label = get(idx.name) || get(idx.company) || `行${i + 1}`;
      skippedNames.push(label);
      continue;
    }

    const name = get(idx.name);
    if (!name) continue;

    const memoParts: string[] = [];
    const dept = get(idx.department);
    if (dept) memoParts.push(`部署: ${dept}`);
    const exchangeDate = get(idx.exchangeDate);
    if (exchangeDate) memoParts.push(`名刺交換日: ${exchangeDate}`);

    contacts.push({
      name,
      company: get(idx.company),
      title: get(idx.title),
      email: get(idx.email),
      phone: get(idx.telDirect) || get(idx.telCompany),
      address: get(idx.address),
      url: get(idx.url),
      memo: memoParts.join("\n"),
    });
  }

  return { contacts, skippedCount: skippedNames.length, skippedNames };
}

function isDuplicate(contact: ParsedContact, existing: Contact): boolean {
  return (
    contact.name.toLowerCase() === existing.name.toLowerCase() &&
    (contact.company || "").toLowerCase() === (existing.company || "").toLowerCase()
  );
}

export default function CsvImportModal({
  open,
  onClose,
  existingContacts,
  onImported,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [duplicateAction, setDuplicateAction] = useState<DuplicateAction>("skip");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const duplicates = parseResult
    ? parseResult.contacts.filter((c) => existingContacts.some((e) => isDuplicate(c, e)))
    : [];
  const newContacts = parseResult
    ? parseResult.contacts.filter((c) => !existingContacts.some((e) => isDuplicate(c, e)))
    : [];

  function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      toast.error("CSVファイルを選択してください");
      return;
    }

    // Try UTF-8 first, then Shift-JIS fallback
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) { toast.error("ファイルの読み込みに失敗しました"); return; }
      const result = parseEightCSV(text);
      if (result.contacts.length === 0 && result.skippedCount === 0) {
        // Try Shift-JIS
        const reader2 = new FileReader();
        reader2.onload = (e2) => {
          const text2 = e2.target?.result as string;
          const result2 = parseEightCSV(text2 || "");
          setParseResult(result2);
          setStep("preview");
        };
        reader2.readAsText(file, "Shift-JIS");
        return;
      }
      setParseResult(result);
      setStep("preview");
    };
    reader.readAsText(file, "UTF-8");
  }

  async function handleImport() {
    if (!parseResult) return;
    setStep("importing");

    const res = await fetch("/api/contacts/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contacts: parseResult.contacts,
        duplicateAction,
      }),
    });

    if (!res.ok) {
      toast.error("インポートに失敗しました");
      setStep("preview");
      return;
    }

    const data = await res.json();
    setImportResult(data);
    onImported(data.newContacts ?? []);
    setStep("done");
  }

  function handleClose() {
    setStep("upload");
    setParseResult(null);
    setImportResult(null);
    setDuplicateAction("skip");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="rounded-2xl max-w-md"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--color-text)" }}>
            CSVインポート
          </DialogTitle>
        </DialogHeader>

        {/* Step: upload */}
        {step === "upload" && (
          <div className="mt-2">
            <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
              名刺管理アプリからエクスポートしたCSVファイルを選択してください。
            </p>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className="rounded-xl p-10 text-center cursor-pointer transition-colors"
              style={{
                border: `2px dashed ${isDragging ? "var(--color-accent)" : "var(--color-border)"}`,
                backgroundColor: isDragging ? "#f0faf5" : "var(--color-bg)",
              }}
            >
              <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                ここにCSVをドロップ
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--color-muted)" }}>
                またはクリックしてファイルを選択
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* Step: preview */}
        {step === "preview" && parseResult && (
          <div className="mt-2 space-y-4">
            {/* サマリー */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text)" }}>新規追加</span>
                <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  {newContacts.length}件
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text)" }}>重複（既存あり）</span>
                <span className="font-semibold" style={{ color: "#f59e0b" }}>
                  {duplicates.length}件
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text)" }}>スキップ（要手動入力）</span>
                <span className="font-semibold" style={{ color: "#ef4444" }}>
                  {parseResult.skippedCount}件
                </span>
              </div>
            </div>

            {/* スキップされた連絡先 */}
            {parseResult.skippedCount > 0 && (
              <div
                className="rounded-xl p-3 text-xs"
                style={{ backgroundColor: "#fef9c3", border: "1px solid #fde68a" }}
              >
                <p className="font-semibold mb-1" style={{ color: "#92400e" }}>
                  ⚠️ 不確かなデータのためスキップ（手動入力をお願いします）
                </p>
                <p style={{ color: "#92400e" }}>
                  {parseResult.skippedNames.slice(0, 5).join("、")}
                  {parseResult.skippedNames.length > 5 && ` 他${parseResult.skippedNames.length - 5}件`}
                </p>
              </div>
            )}

            {/* 重複の処理方法 */}
            {duplicates.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  重複データの処理方法
                </p>
                <div className="space-y-2">
                  {(
                    [
                      { value: "overwrite", label: "上書きする", desc: "既存データを新しい内容で更新" },
                      { value: "skip", label: "スキップ", desc: "既存データをそのまま維持" },
                      { value: "keep_both", label: "両方残す", desc: "重複でも新規として追加" },
                    ] as { value: DuplicateAction; label: string; desc: string }[]
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-start gap-3 cursor-pointer rounded-lg p-3"
                      style={{
                        border: `1px solid ${duplicateAction === opt.value ? "var(--color-accent)" : "var(--color-border)"}`,
                        backgroundColor: duplicateAction === opt.value ? "#f0faf5" : "var(--color-bg)",
                      }}
                    >
                      <input
                        type="radio"
                        name="duplicateAction"
                        value={opt.value}
                        checked={duplicateAction === opt.value}
                        onChange={() => setDuplicateAction(opt.value)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {opt.label}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                          {opt.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--color-muted)" }}>
                  重複: {duplicates.slice(0, 3).map((c) => c.name).join("、")}
                  {duplicates.length > 3 && ` 他${duplicates.length - 3}件`}
                </p>
              </div>
            )}

            {parseResult.contacts.length === 0 && parseResult.skippedCount === 0 ? (
              <p className="text-sm text-center" style={{ color: "var(--color-muted)" }}>
                インポートできるデータがありませんでした
              </p>
            ) : (
              <Button
                onClick={handleImport}
                disabled={parseResult.contacts.length === 0}
                className="w-full h-11 rounded-lg font-semibold"
                style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              >
                インポートする（{parseResult.contacts.length}件）
              </Button>
            )}
            <button
              onClick={handleClose}
              className="w-full text-sm"
              style={{ color: "var(--color-muted)" }}
            >
              キャンセル
            </button>
          </div>
        )}

        {/* Step: importing */}
        {step === "importing" && (
          <div className="mt-4 text-center py-8">
            <div
              className="inline-block w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3"
              style={{ borderColor: "var(--color-accent)", borderTopColor: "transparent" }}
            />
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              インポート中...
            </p>
          </div>
        )}

        {/* Step: done */}
        {step === "done" && importResult && (
          <div className="mt-2 text-center space-y-4">
            <p className="text-4xl">✓</p>
            <p className="font-semibold" style={{ color: "var(--color-text)" }}>
              インポート完了
            </p>
            <div
              className="rounded-xl p-4 space-y-2 text-left"
              style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text)" }}>新規追加</span>
                <span className="font-semibold" style={{ color: "var(--color-accent)" }}>
                  {importResult.imported}件
                </span>
              </div>
              {importResult.updated > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text)" }}>上書き更新</span>
                  <span className="font-semibold" style={{ color: "#f59e0b" }}>
                    {importResult.updated}件
                  </span>
                </div>
              )}
              {importResult.skipped > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text)" }}>スキップ</span>
                  <span className="font-semibold" style={{ color: "var(--color-muted)" }}>
                    {importResult.skipped}件
                  </span>
                </div>
              )}
            </div>
            <Button
              onClick={handleClose}
              className="w-full h-11 rounded-lg font-semibold"
              style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
            >
              閉じる
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
