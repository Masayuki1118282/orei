import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ContactDetailClient from "./contact-detail-client";
import { GeneratedEmail } from "@/types";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!contact) notFound();

  const { data: latestEmail } = await supabase
    .from("generated_emails")
    .select("*")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return <ContactDetailClient contact={contact} latestEmail={latestEmail as GeneratedEmail | null} />;
}
