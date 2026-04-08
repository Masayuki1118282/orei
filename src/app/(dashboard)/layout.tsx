import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // オンボーディング未完了チェック
  const { data: profile } = await supabase
    .from("profiles")
    .select("industry, proposal_goal, job_title")
    .eq("id", user.id)
    .single();

  const onboardingDone =
    profile?.industry && profile?.proposal_goal && profile?.job_title;

  if (!onboardingDone) {
    redirect("/onboarding");
  }

  return <>{children}</>;
}
