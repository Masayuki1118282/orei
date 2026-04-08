"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Profile, isPaidPlan } from "@/types";

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
  const [portalLoading, setPortalLoading] = useState(false);

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

  async function handleUpgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
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

        {/* プラン */}
        <section id="plan" className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--color-text)" }}>プラン</h3>
            <Badge style={{
              backgroundColor: profile && isPaidPlan(profile.plan) ? "#f0faf5" : "#fef9c3",
              color: profile && isPaidPlan(profile.plan) ? "var(--color-accent)" : "#854d0e",
              border: "none",
            }}>
              {profile?.plan === "personal_yearly" ? "PERSONAL 年額" : profile && isPaidPlan(profile.plan) ? "PERSONAL" : "FREE"}
            </Badge>
          </div>
          {!profile || !isPaidPlan(profile.plan) ? (
            <div>
              <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                無料プランは月5通まで。PERSONALプランで月50通まで利用できます。
              </p>
              <Button onClick={handleUpgrade} className="w-full h-11 rounded-lg font-semibold" style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}>
                PERSONALプランへアップグレード（¥1,980/月）
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
                月50通まで利用できます。解約・変更はStripeポータルから。
              </p>
              <Button onClick={handlePortal} disabled={portalLoading} variant="outline" className="w-full h-11 rounded-lg" style={{ borderColor: "var(--color-border)" }}>
                {portalLoading ? "処理中..." : "サブスクリプション管理"}
              </Button>
            </div>
          )}
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
