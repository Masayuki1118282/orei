// ユーザープロフィール型
export type PlanType = "free" | "light_monthly" | "light_yearly" | "personal_monthly" | "personal_yearly";

export type UseCase = "thank_you" | "cold_dm";

export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  job_title: string | null;
  service_description: string | null;
  industry: string | null;
  proposal_goal: string | null;
  use_case: UseCase | null;
  plan: PlanType;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  monthly_usage: number;
  usage_reset_date: string;
  email_signature: string | null;
  use_signature: boolean;
  created_at: string;
};

// 連絡先（名刺データ）型
export type Contact = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  address: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  url: string | null;
  memo: string | null;
  card_image_url: string | null;
  company_description: string | null;
  company_confirmed: boolean;
  is_sent: boolean;
  created_at: string;
};

// 生成済みメール型
export type GeneratedEmail = {
  id: string;
  user_id: string;
  contact_id: string | null;
  subjects: string[];
  bodies: string[];
  followups: { timing: string; body: string }[];
  use_case: UseCase;
  created_at: string;
};

// OCRレスポンス型
export type OcrResult = {
  name: string;
  company: string;
  address: string;
  title: string;
  email: string;
  phone: string;
  url: string;
  memo: string;
};

// メモタイムラインエントリ
export type MemoEntry = {
  date: string;
  text: string;
};

// 会社情報型
export type CompanyInfo = {
  location: string;
  industry: string;
  summary: string;
  is_estimated: boolean;
};

// プラン上限
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 7,
  light_monthly: 20,
  light_yearly: 20,
  personal_monthly: 50,
  personal_yearly: 50,
};

// プランが有料かどうか
export function isPaidPlan(plan: PlanType): boolean {
  return plan !== "free";
}

// プラン表示名
export const PLAN_LABELS: Record<PlanType, string> = {
  free: "FREE",
  light_monthly: "LIGHT",
  light_yearly: "LIGHT 年額",
  personal_monthly: "PERSONAL",
  personal_yearly: "PERSONAL 年額",
};
