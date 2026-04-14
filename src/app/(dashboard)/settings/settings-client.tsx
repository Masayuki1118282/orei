"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Profile, isPaidPlan, PLAN_LABELS, PLAN_LIMITS } from "@/types";

type Props = {
  profile: Profile | null;
  userEmail: string;
};

export default function SettingsClient({ profile, userEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "");
  const [serviceDescription, setServiceDescription] = useState(profile?.service_description ?? "");
  const [saving, setSaving] = useState(false);
  const [sigSaving, setSigSaving] = useState(false);
  const [useSignature, setUseSignature] = useState(profile?.use_signature ?? false);
  const [emailSignature, setEmailSignature] = useState(profile?.email_signature ?? "");
  const [portalLoading, setPortalLoading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, company_name: companyName, job_title: jobTitle, service_description: serviceDescription })
      .eq("id", user.id);

    setSaving(false);
    if (error) { toast.error("保存に失敗しました"); return; }
    toast.success("保存しました");
  }

  async function handleSaveSignature() {
    setSigSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ use_signature: useSignature, email_signature: emailSignature || null })
      .eq("id", user.id);
    setSigSaving(false);
    if (error) { toast.error("保存に失敗しました"); return; }
    toast.success("署名を保存しました");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handlePortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { toast.error("処理に失敗しました"); setPortalLoading(false); }
  }

  async function handleEmailChange() {
    if (!newEmail.trim()) return;
    setEmailSaving(true);
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    setEmailSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("確認メールを送信しました。新しいアドレスで受信を確認してください。");
    setNewEmail("");
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) { toast.error("パスワードが一致しません"); return; }
    if (newPassword.length < 8) { toast.error("パスワードは8文字以上で入力してください"); return; }
    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) { toast.error("パスワードの変更に失敗しました"); return; }
    toast.success("パスワードを変更しました");
    setNewPassword("");
    setConfirmPassword("");
  }

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  async function handleCheckout(planType: string) {
    setCheckoutLoading(planType);
    const envMap: Record<string, string | undefined> = {
      light_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIGHT_MONTHLY,
      light_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_LIGHT_YEARLY,
      personal_monthly: undefined,
      personal_yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PERSONAL_YEARLY,
    };
    const body: Record<string, string> = { planType };
    const priceId = envMap[planType];
    if (priceId) body.priceId = priceId;
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { toast.error("処理に失敗しました"); setCheckoutLoading(null); }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <header
        className="sticky top-0 z-10 px-4 py-4 flex items-center gap-3"
        style={{ backgroundColor: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <button onClick={() => router.push("/dashboard")} className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← ダッシュボード
        </button>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>設定</h2>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* プロフィール */}
        <section className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>プロフィール</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>メールアドレス</Label>
              <Input value={userEmail} disabled className="h-11 rounded-lg bg-gray-50" style={{ fontSize: "16px" }} />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>お名前</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>会社名</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>役職</Label>
              <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>提供サービスの説明</Label>
              <Input value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)} className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-11 rounded-lg mt-4 font-semibold" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {saving ? "保存中..." : "保存する"}
          </Button>
        </section>

        {/* メール署名 */}
        <section className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>メール署名</h3>
          <div className="flex items-center justify-between mb-3">
            <Label style={{ color: "var(--color-text)" }}>メールに署名を自動挿入する</Label>
            <button
              type="button"
              onClick={() => setUseSignature((v) => !v)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
              style={{ backgroundColor: useSignature ? "var(--color-accent)" : "var(--color-border)" }}
            >
              <span
                className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                style={{ transform: useSignature ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
          </div>
          {useSignature && (
            <div className="space-y-1 mb-4">
              <Textarea
                value={emailSignature}
                onChange={(e) => setEmailSignature(e.target.value)}
                placeholder={`株式会社〇〇\n大塚雅之\nTEL: 000-0000-0000\nEmail: xxx@xxx.com`}
                className="rounded-lg resize-none"
                rows={5}
                style={{ fontSize: "16px" }}
              />
            </div>
          )}
          <Button onClick={handleSaveSignature} disabled={sigSaving} className="w-full h-11 rounded-lg font-semibold" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {sigSaving ? "保存中..." : "保存する"}
          </Button>
        </section>

        {/* プラン */}
        <section id="plan" className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>プラン</h3>
            <Badge style={{
              backgroundColor: profile && isPaidPlan(profile.plan) ? "#f0faf5" : "#fef9c3",
              color: profile && isPaidPlan(profile.plan) ? "var(--color-accent)" : "#854d0e",
              border: "none",
            }}>
              {profile ? PLAN_LABELS[profile.plan] : "FREE"}
            </Badge>
          </div>

          {/* プランカード */}
          <div className="space-y-3 mb-4">
            {([
              { planType: "light_monthly",  label: "LIGHT 月額",    price: "¥980/月",  desc: "月20通" },
              { planType: "light_yearly",   label: "LIGHT 年額",    price: "¥8,160/年", desc: "月20通・月換算¥680" },
              { planType: "personal_monthly", label: "PERSONAL 月額", price: "¥1,980/月", desc: "月50通" },
              { planType: "personal_yearly",  label: "PERSONAL 年額", price: "¥15,360/年", desc: "月50通・月換算¥1,280" },
            ] as const).map(({ planType, label, price, desc }) => {
              const isCurrent = profile?.plan === planType;
              return (
                <div
                  key={planType}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{
                    border: isCurrent ? "2px solid var(--color-accent)" : "1px solid var(--color-border)",
                    backgroundColor: isCurrent ? "#f0faf5" : "var(--color-bg)",
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--color-muted)" }}>{price}・{desc}</p>
                  </div>
                  {isCurrent ? (
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}>
                      現在のプラン
                    </span>
                  ) : (
                    <Button
                      onClick={() => handleCheckout(planType)}
                      disabled={!!checkoutLoading}
                      className="h-8 px-4 text-xs rounded-lg font-semibold"
                      style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                    >
                      {checkoutLoading === planType ? "処理中..." : profile && isPaidPlan(profile.plan) ? "変更する" : "申し込む"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {isPaidPlan(profile?.plan ?? "free") && (
            <Button onClick={handlePortal} disabled={portalLoading} variant="outline" className="w-full h-10 rounded-lg text-sm" style={{ borderColor: "var(--color-border)" }}>
              {portalLoading ? "処理中..." : "解約・支払い管理（Stripeポータル）"}
            </Button>
          )}
        </section>

        {/* メールアドレス変更 */}
        <section className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>メールアドレスの変更</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>現在のメールアドレス</Label>
              <Input value={userEmail} disabled className="h-11 rounded-lg bg-gray-50" style={{ fontSize: "16px" }} />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>新しいメールアドレス</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="new@example.com" className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
          </div>
          <p className="text-xs mt-2 mb-3" style={{ color: "var(--color-muted)" }}>変更後、新しいアドレスに確認メールが届きます。</p>
          <Button onClick={handleEmailChange} disabled={emailSaving || !newEmail.trim()} className="w-full h-11 rounded-lg font-semibold" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {emailSaving ? "送信中..." : "確認メールを送る"}
          </Button>
        </section>

        {/* パスワード変更 */}
        <section className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <h3 className="font-semibold mb-4" style={{ color: "var(--color-text)" }}>パスワードの変更</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>新しいパスワード</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="••••••••（8文字以上）" className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
            <div className="space-y-1">
              <Label style={{ color: "var(--color-text)" }}>パスワード（確認）</Label>
              <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••••" className="h-11 rounded-lg" style={{ fontSize: "16px" }} />
            </div>
          </div>
          <Button onClick={handlePasswordChange} disabled={passwordSaving || !newPassword} className="w-full h-11 rounded-lg font-semibold mt-4" style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
            {passwordSaving ? "変更中..." : "パスワードを変更する"}
          </Button>
        </section>

        <Separator />

        {/* ログアウト */}
        <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-lg" style={{ borderColor: "#ef4444", color: "#ef4444" }}>
          ログアウト
        </Button>
      </main>
    </div>
  );
}
