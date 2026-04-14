import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface ImportContact {
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  url: string;
  memo: string;
}

type DuplicateAction = "overwrite" | "skip" | "keep_both";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { contacts, duplicateAction } = await request.json() as {
    contacts: ImportContact[];
    duplicateAction: DuplicateAction;
  };

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "No contacts" }, { status: 400 });
  }

  // Fetch existing contacts for duplicate detection
  const { data: existing } = await supabase
    .from("contacts")
    .select("id, name, company")
    .eq("user_id", user.id);

  const existingList = existing ?? [];

  function findDuplicate(contact: ImportContact) {
    return existingList.find(
      (e) =>
        contact.name.toLowerCase() === e.name.toLowerCase() &&
        (contact.company || "").toLowerCase() === (e.company || "").toLowerCase()
    );
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const newContacts: object[] = [];

  for (const contact of contacts) {
    const dup = findDuplicate(contact);

    if (dup) {
      if (duplicateAction === "skip") {
        skipped++;
        continue;
      } else if (duplicateAction === "overwrite") {
        const { error } = await supabase
          .from("contacts")
          .update({
            company: contact.company || null,
            title: contact.title || null,
            email: contact.email || null,
            phone: contact.phone || null,
            address: contact.address || null,
            url: contact.url || null,
            memo: contact.memo || null,
          })
          .eq("id", dup.id)
          .eq("user_id", user.id);
        if (!error) updated++;
        continue;
      }
      // keep_both: fall through to insert
    }

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        user_id: user.id,
        name: contact.name,
        company: contact.company || null,
        title: contact.title || null,
        email: contact.email || null,
        phone: contact.phone || null,
        address: contact.address || null,
        url: contact.url || null,
        memo: contact.memo || null,
      })
      .select()
      .single();

    if (!error && data) {
      imported++;
      newContacts.push(data);
    }
  }

  return NextResponse.json({ imported, updated, skipped, newContacts });
}
