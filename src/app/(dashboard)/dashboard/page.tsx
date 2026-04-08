import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { PLAN_LIMITS, PlanType, UseCase } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // プロフィールと連絡先を並行取得
  const [{ data: profile }, { data: contacts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, plan, monthly_usage, usage_reset_date, use_case, tutorial_completed")
      .eq("id", user.id)
      .single(),
    supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const plan = (profile?.plan ?? "free") as PlanType;
  const useCase = (profile?.use_case ?? "thank_you") as UseCase;
  const limit = PLAN_LIMITS[plan];
  const remaining = Math.max(0, limit - (profile?.monthly_usage ?? 0));

  return (
    <DashboardClient
      contacts={contacts ?? []}
      remaining={remaining}
      limit={limit}
      plan={plan}
      useCase={useCase}
      userName={profile?.full_name ?? ""}
      tutorialCompleted={profile?.tutorial_completed ?? false}
    />
  );
}
