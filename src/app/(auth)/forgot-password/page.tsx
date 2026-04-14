"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        toast.error("送信に失敗しました。メールアドレスを確認してください。");
        return;
      }
      setSent(true);
    } catch {
      toast.error("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
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
            パスワードをお忘れの方
          </h2>

          {sent ? (
            <div className="text-center py-4">
              <p className="text-sm mb-2" style={{ color: "var(--color-text)" }}>
                パスワード再設定メールを送信しました。
              </p>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                {email} 宛に届いたメールのリンクからパスワードを再設定してください。
              </p>
              <Link href="/login" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
                ログインページへ戻る
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                登録済みのメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" style={{ color: "var(--color-text)" }}>メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                  {loading ? "送信中..." : "再設定メールを送る"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm" style={{ color: "var(--color-muted)" }}>
                <Link href="/login" className="font-medium" style={{ color: "var(--color-accent)" }}>
                  ← ログインに戻る
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
