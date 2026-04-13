"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("パスワードが一致しません");
      return;
    }
    if (password.length < 8) {
      toast.error("パスワードは8文字以上で入力してください");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("パスワードの変更に失敗しました");
      return;
    }
    toast.success("パスワードを変更しました");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/images/logo.svg" alt="OREI" width={120} height={38} priority />
          </div>
        </div>

        <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            新しいパスワードを設定
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
            8文字以上のパスワードを入力してください。
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="password" style={{ color: "var(--color-text)" }}>新しいパスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 rounded-lg"
                style={{ fontSize: "16px" }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm" style={{ color: "var(--color-text)" }}>パスワード（確認）</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 rounded-lg"
                style={{ fontSize: "16px" }}
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg font-semibold"
              style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
            >
              {loading ? "変更中..." : "パスワードを変更する"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
