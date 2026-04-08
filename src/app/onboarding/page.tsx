"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// 選択肢定義
const INDUSTRIES = [
  { value: "IT", label: "IT・SaaS" },
  { value: "manufacturing", label: "製造業" },
  { value: "consulting", label: "コンサルティング" },
  { value: "finance", label: "金融・保険" },
  { value: "real_estate", label: "不動産" },
  { value: "other", label: "その他" },
];

const PROPOSAL_GOALS = [
  { value: "new_order", label: "新規受注" },
  { value: "hiring", label: "採用" },
  { value: "partnership", label: "パートナー契約" },
  { value: "other", label: "その他" },
];

const JOB_TITLES = [
  { value: "sales", label: "営業" },
  { value: "bizdev", label: "事業開発" },
  { value: "founder", label: "代表・役員" },
  { value: "recruiter", label: "採用担当" },
  { value: "other", label: "その他" },
];

const USE_CASES = [
  {
    value: "thank_you",
    label: "名刺交換後のお礼メール",
    desc: "商談・展示会後に相手へ送るパーソナライズされたお礼メールを生成",
    icon: "🤝",
  },
  {
    value: "cold_dm",
    label: "新規アプローチのDM",
    desc: "まだ面識のない見込み客へ送るコールドメール・SNS DMを生成",
    icon: "📨",
  },
];

type Step = "use_case" | "industry" | "goal" | "title" | "profile";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("use_case");
  const [useCase, setUseCase] = useState("");
  const [industry, setIndustry] = useState("");
  const [goal, setGoal] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const steps: Step[] = ["use_case", "industry", "goal", "title", "profile"];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  async function handleFinish() {
    if (!fullName.trim()) {
      toast.error("お名前を入力してください");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        use_case: useCase || "thank_you",
        industry,
        proposal_goal: goal,
        job_title: jobTitle,
        full_name: fullName,
        company_name: companyName,
        service_description: serviceDescription,
      });

    if (error) {
      toast.error("保存に失敗しました。もう一度お試しください");
      setSaving(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="w-full max-w-lg">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}>
            OREI
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>
            最初に少しだけ教えてください（約1分）
          </p>
        </div>

        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex justify-between text-xs mb-2" style={{ color: "var(--color-muted)" }}>
            <span>ステップ {currentIndex + 1} / {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full" style={{ backgroundColor: "var(--color-border)" }}>
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: "var(--color-accent)" }}
            />
          </div>
        </div>

        {/* カード */}
        <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>

          {/* Step 1: 用途 */}
          {step === "use_case" && (
            <div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                どちらの用途で使いますか？
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                用途に合わせたメール戦略で生成します
              </p>
              <div className="space-y-3">
                {USE_CASES.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => { setUseCase(item.value); setStep("industry"); }}
                    className="w-full p-4 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${useCase === item.value ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: useCase === item.value ? "#f0faf5" : "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{item.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: 業種 */}
          {step === "industry" && (
            <div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                あなたの業種を教えてください
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                業種に合わせたメール文体で生成します
              </p>
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => { setIndustry(item.value); setStep("goal"); }}
                    className="p-4 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      border: `2px solid ${industry === item.value ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: industry === item.value ? "#f0faf5" : "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: 提案目的 */}
          {step === "goal" && (
            <div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                主な提案目的は何ですか？
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                目的に応じて訴求ポイントを調整します
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PROPOSAL_GOALS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => { setGoal(item.value); setStep("title"); }}
                    className="p-4 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      border: `2px solid ${goal === item.value ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: goal === item.value ? "#f0faf5" : "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("industry")}
                className="mt-4 text-sm"
                style={{ color: "var(--color-muted)" }}
              >
                ← 戻る
              </button>
            </div>
          )}

          {/* Step 4: 肩書き */}
          {step === "title" && (
            <div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                あなたの肩書きは？
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                メール内での自己紹介に使います
              </p>
              <div className="grid grid-cols-2 gap-3">
                {JOB_TITLES.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => { setJobTitle(item.value); setStep("profile"); }}
                    className="p-4 rounded-xl text-sm font-medium text-left transition-all"
                    style={{
                      border: `2px solid ${jobTitle === item.value ? "var(--color-accent)" : "var(--color-border)"}`,
                      backgroundColor: jobTitle === item.value ? "#f0faf5" : "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep("goal")}
                className="mt-4 text-sm"
                style={{ color: "var(--color-muted)" }}
              >
                ← 戻る
              </button>
            </div>
          )}

          {/* Step 5: プロフィール入力 */}
          {step === "profile" && (
            <div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                あなたの情報を入力してください
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                メール差出人情報として使います
              </p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label style={{ color: "var(--color-text)" }}>
                    お名前 <span style={{ color: "#ef4444" }}>*</span>
                  </Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="山田 太郎"
                    className="h-12 rounded-lg"
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <div className="space-y-1">
                  <Label style={{ color: "var(--color-text)" }}>会社名</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="株式会社〇〇"
                    className="h-12 rounded-lg"
                    style={{ fontSize: "16px" }}
                  />
                </div>
                <div className="space-y-1">
                  <Label style={{ color: "var(--color-text)" }}>
                    提供サービスの説明
                  </Label>
                  <Input
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="中小企業向けのクラウド型勤怠管理SaaS"
                    className="h-12 rounded-lg"
                    style={{ fontSize: "16px" }}
                  />
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    メール内でのサービス紹介に使います
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep("title")}
                  className="text-sm px-4"
                  style={{ color: "var(--color-muted)" }}
                >
                  ← 戻る
                </button>
                <Button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 h-12 rounded-lg font-semibold"
                  style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
                >
                  {saving ? "保存中..." : "はじめる →"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
