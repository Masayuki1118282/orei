"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Googleログインに失敗しました");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="w-full max-w-md">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/images/logo.svg" alt="OREI" width={120} height={38} priority />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            名刺からお礼メールを3秒で
          </p>
        </div>

        {/* カード */}
        <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--color-text)" }}>
            ログイン
          </h2>

          {/* Googleログイン */}
          <Button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            variant="outline"
            className="w-full mb-4 h-12 rounded-lg"
            style={{ borderColor: "var(--color-border)" }}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "接続中..." : "Googleでログイン"}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--color-border)" }} />
            </div>
            <div className="relative flex justify-center text-xs" style={{ color: "var(--color-muted)" }}>
              <span className="px-2" style={{ backgroundColor: "var(--color-surface)" }}>またはメールで</span>
            </div>
          </div>

          {/* メールログインフォーム */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
            <div className="space-y-1">
              <Label htmlFor="password" style={{ color: "var(--color-text)" }}>パスワード</Label>
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg font-semibold"
              style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
            >
              {loading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--color-muted)" }}>
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="font-medium" style={{ color: "var(--color-accent)" }}>
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
