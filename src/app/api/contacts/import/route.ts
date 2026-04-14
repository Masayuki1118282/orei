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

  const MAX_IMPORT = 500;
  if (contacts.length > MAX_IMPORT) {
    return NextResponse.json(
      { error: `一度にインポートできるのは${MAX_IMPORT}件までです。CSVを分割してください。` },
      { status: 400 }
    );
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

  const toInsert: ImportContact[] = [];
  const toOverwrite: { id: string; contact: ImportContact }[] = [];
  let skipped = 0;

  for (const contact of contacts) {
    const dup = findDuplicate(contact);
    if (dup) {
      if (duplicateAction === "skip") {
        skipped++;
      } else if (duplicateAction === "overwrite") {
        toOverwrite.push({ id: dup.id, contact });
      } else {
        // keep_both
        toInsert.push(contact);
      }
    } else {
      toInsert.push(contact);
    }
  }

  // Bulk insert new contacts
  let imported = 0;
  let newContacts: object[] = [];
  if (toInsert.length > 0) {
    const { data, error } = await supabase
      .from("contacts")
      .insert(
        toInsert.map((c) => ({
          user_id: user.id,
          name: c.name,
          company: c.company || null,
          title: c.title || null,
          email: c.email || null,
          phone: c.phone || null,
          address: c.address || null,
          url: c.url || null,
          memo: c.memo || null,
        }))
      )
      .select();
    if (!error && data) {
      imported = data.length;
      newContacts = data;
    }
  }

  // Parallel batch updates for overwrites (chunks of 20 to avoid connection exhaustion)
  let updated = 0;
  const CHUNK = 20;
  for (let i = 0; i < toOverwrite.length; i += CHUNK) {
    const chunk = toOverwrite.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(({ id, contact }) =>
        supabase
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
          .eq("id", id)
          .eq("user_id", user.id)
      )
    );
    updated += results.filter((r) => !r.error).length;
  }

  return NextResponse.json({ imported, updated, skipped, newContacts });
}
