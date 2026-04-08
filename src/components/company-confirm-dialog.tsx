"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CompanyInfo } from "@/types";

type Props = {
  open: boolean;
  company: string;
  url?: string;
  onConfirm: (description: string) => void;
  onClose: () => void;
};

export default function CompanyConfirmDialog({
  open,
  company,
  url,
  onConfirm,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState(false);

  // 手動修正フォーム
  const [editLocation, setEditLocation] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editSummary, setEditSummary] = useState("");

  useEffect(() => {
    if (!open || !company) return;
    setInfo(null);
    setError(false);
    setEditing(false);
    fetchCompanyInfo();
  }, [open, company, url]);

  async function fetchCompanyInfo() {
    setLoading(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, url }),
      });
      if (!res.ok) throw new Error();
      const data: CompanyInfo = await res.json();
      setInfo(data);
      setEditLocation(data.location);
      setEditIndustry(data.industry);
      setEditSummary(data.summary);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (!info) return;
    onConfirm(info.summary);
  }

  function handleEditConfirm() {
    const description = editSummary.trim() || `${editLocation}の${editIndustry}`;
    onConfirm(description);
  }

  // エラー時は手動入力フォームを展開
  if (error && open) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="rounded-2xl max-w-md" style={{ backgroundColor: "var(--color-surface)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "var(--color-text)" }}>
              会社情報を入力してください
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              「{company}」の情報を手動で入力してください。
            </p>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>所在地</Label>
              <Input
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="東京都"
                className="h-11 rounded-lg"
                style={{ fontSize: "16px" }}
              />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>業種</Label>
              <Input
                value={editIndustry}
                onChange={(e) => setEditIndustry(e.target.value)}
                placeholder="ITサービス"
                className="h-11 rounded-lg"
                style={{ fontSize: "16px" }}
              />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>事業内容（40文字以内）</Label>
              <Input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                placeholder="中小企業向けのクラウドサービスを提供する会社"
                maxLength={40}
                className="h-11 rounded-lg"
                style={{ fontSize: "16px" }}
              />
            </div>
            <Button
              onClick={handleEditConfirm}
              className="w-full h-11 rounded-lg font-semibold"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
            >
              保存して続ける
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md" style={{ backgroundColor: "var(--color-surface)" }}>
        <DialogHeader>
          <DialogTitle style={{ color: "var(--color-text)" }}>
            会社情報の確認
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {/* ローディング */}
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-16 w-full rounded" />
              <div className="flex gap-3">
                <Skeleton className="h-11 flex-1 rounded-lg" />
                <Skeleton className="h-11 flex-1 rounded-lg" />
              </div>
            </div>
          )}

          {/* 確認UI */}
          {!loading && info && !editing && (
            <div>
              <p className="text-base mb-1" style={{ color: "var(--color-text)" }}>
                「<strong>{company}</strong>」は
              </p>
              <div
                className="rounded-xl p-4 mb-3"
                style={{ backgroundColor: "var(--color-bg)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {info.location} / {info.industry}
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--color-muted)" }}>
                  {info.summary}
                </p>
              </div>

              {info.is_estimated && (
                <p className="text-xs mb-4 flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
                  <span>⚠️</span> 情報が少ないため推測です
                </p>
              )}

              <p className="text-sm mb-4" style={{ color: "var(--color-text)" }}>
                間違いないですか？
              </p>

              <div className="flex gap-3">
                <Button
                  onClick={handleConfirm}
                  className="flex-1 h-11 rounded-lg font-semibold"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                >
                  合っています
                </Button>
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                  className="flex-1 h-11 rounded-lg"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                >
                  違います・修正する
                </Button>
              </div>
            </div>
          )}

          {/* 手動修正フォーム */}
          {!loading && editing && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                正しい情報を入力してください
              </p>
              <div className="space-y-1">
                <Label style={{ color: "var(--color-text)" }}>所在地</Label>
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="東京都"
                  className="h-11 rounded-lg"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div className="space-y-1">
                <Label style={{ color: "var(--color-text)" }}>業種</Label>
                <Input
                  value={editIndustry}
                  onChange={(e) => setEditIndustry(e.target.value)}
                  placeholder="ITサービス"
                  className="h-11 rounded-lg"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div className="space-y-1">
                <Label style={{ color: "var(--color-text)" }}>事業内容（40文字以内）</Label>
                <Input
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  maxLength={40}
                  className="h-11 rounded-lg"
                  style={{ fontSize: "16px" }}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setEditing(false)}
                  variant="outline"
                  className="h-11 rounded-lg px-4"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  戻る
                </Button>
                <Button
                  onClick={handleEditConfirm}
                  className="flex-1 h-11 rounded-lg font-semibold"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                >
                  この内容で保存
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
