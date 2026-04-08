import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import { PLAN_LIMITS, PlanType, UseCase } from "@/types";

export const dynamic = "force-dynamic";

async function syncPlanFromStripe(userId: string): Promise<PlanType | null> {
  try {
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", userId)
      .single();

    console.log("[dashboard/page] syncPlan profile.plan:", profile?.plan, "stripe_customer_id:", profile?.stripe_customer_id);

    if (!profile?.stripe_customer_id) return null;

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
    });

    console.log("[dashboard/page] syncPlan active subs:", subscriptions.data.length);

    if (subscriptions.data.length === 0) {
      const allSubs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, limit: 5 });
      console.log("[dashboard/page] syncPlan all subs:", allSubs.data.map(s => ({ id: s.id, status: s.status })));
      return null;
    }

    const sub = subscriptions.data[0];
    const yearlyPriceId = process.env.STRIPE_PRICE_ID_PERSONAL_YEARLY;
    const priceId = sub.items.data[0]?.price?.id;
    const newPlan: PlanType = (yearlyPriceId && priceId === yearlyPriceId)
      ? "personal_yearly"
      : "personal_monthly";

    const { error } = await serviceClient
      .from("profiles")
      .update({ plan: newPlan, stripe_subscription_id: sub.id })
      .eq("id", userId);

    console.log("[dashboard/page] syncPlan updated to:", newPlan, "error:", error);
    return newPlan;
  } catch (e) {
    console.error("[dashboard/page] syncPlan error:", e);
    return null;
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const isUpgraded = params.upgraded === "1";

  // ?upgraded=1 の場合はサーバーサイドで直接Stripeと同期
  let syncedPlan: PlanType | null = null;
  if (isUpgraded) {
    syncedPlan = await syncPlanFromStripe(user.id);
    console.log("[dashboard/page] isUpgraded=true, syncedPlan:", syncedPlan);
  }

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

  // syncedPlanがあればそちらを優先（DBの反映を待たずに正しいプランを表示）
  const plan = (syncedPlan ?? profile?.plan ?? "free") as PlanType;
  const useCase = (profile?.use_case ?? "thank_you") as UseCase;
  const limit = PLAN_LIMITS[plan];
  const remaining = Math.max(0, limit - (profile?.monthly_usage ?? 0));
  console.log("[dashboard/page] final plan:", plan, "remaining:", remaining);

  return (
    <DashboardClient
      contacts={contacts ?? []}
      remaining={remaining}
      limit={limit}
      plan={plan}
      useCase={useCase}
      userName={profile?.full_name ?? ""}
      tutorialCompleted={profile?.tutorial_completed ?? false}
      showUpgradeSuccess={isUpgraded && !!syncedPlan}
    />
  );
}
