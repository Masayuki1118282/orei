/**
 * Supabaseデータベースセットアップスクリプト
 * 使用方法: node scripts/setup-db.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// .env.localを手動で読み込む
const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

// プロジェクトrefをURLから抽出
const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

const SQL = `
-- ユーザープロフィール（自社サービス情報）
CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID REFERENCES auth.users PRIMARY KEY,
  full_name             TEXT,
  company_name          TEXT,
  job_title             TEXT,
  service_description   TEXT,
  industry              TEXT,
  proposal_goal         TEXT,
  plan                  TEXT DEFAULT 'free' CHECK (plan IN ('free', 'personal')),
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  monthly_usage         INT DEFAULT 0,
  usage_reset_date      DATE DEFAULT CURRENT_DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 連絡先（名刺データ）
CREATE TABLE IF NOT EXISTS contacts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  company             TEXT,
  title               TEXT,
  email               TEXT,
  phone               TEXT,
  url                 TEXT,
  memo                TEXT,
  card_image_url      TEXT,
  company_description TEXT,
  company_confirmed   BOOLEAN DEFAULT FALSE,
  is_sent             BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 生成済みメール履歴
CREATE TABLE IF NOT EXISTS generated_emails (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id  UUID REFERENCES contacts(id) ON DELETE SET NULL,
  subjects    JSONB,
  bodies      JSONB,
  followups   JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ===== RLSポリシー =====

-- profilesテーブル
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- contactsテーブル
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contacts_select_own" ON contacts;
DROP POLICY IF EXISTS "contacts_insert_own" ON contacts;
DROP POLICY IF EXISTS "contacts_update_own" ON contacts;
DROP POLICY IF EXISTS "contacts_delete_own" ON contacts;

CREATE POLICY "contacts_select_own" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert_own" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update_own" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "contacts_delete_own" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- generated_emailsテーブル
ALTER TABLE generated_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "emails_select_own" ON generated_emails;
DROP POLICY IF EXISTS "emails_insert_own" ON generated_emails;
DROP POLICY IF EXISTS "emails_delete_own" ON generated_emails;

CREATE POLICY "emails_select_own" ON generated_emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "emails_insert_own" ON generated_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_delete_own" ON generated_emails
  FOR DELETE USING (auth.uid() = user_id);

-- ===== トリガー: 新規ユーザー登録時にprofileを自動作成 =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Supabase Storage: business-cardsバケット =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-cards', 'business-cards', false)
ON CONFLICT (id) DO NOTHING;

-- Storageポリシー
DROP POLICY IF EXISTS "storage_select_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_own" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_own" ON storage.objects;

CREATE POLICY "storage_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'business-cards' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'business-cards' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'business-cards' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'business-cards' AND auth.uid()::text = (storage.foldername(name))[1]
  );
`;

async function runSQL() {
  console.log(`プロジェクト: ${projectRef}`);
  console.log("SQLを実行中...\n");

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ query: SQL }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("APIエラー:", response.status, text);

    // Management APIが失敗した場合はSupabase REST経由で試行
    console.log("\nManagement API失敗。SQL文を表示します（Supabase SQL Editorに貼り付けてください）:");
    console.log("---");
    console.log(SQL);
    return;
  }

  const result = await response.json();
  console.log("✅ セットアップ完了:", JSON.stringify(result, null, 2));
}

runSQL().catch(console.error);
