import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";
import { PLAN_LIMITS } from "@/types";

// レート制限（メモリ内・サーバー再起動でリセット）
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// メモJSON → 人間が読める形式に変換
function formatMemo(memoRaw: string | null): string {
  if (!memoRaw) return "";
  try {
    const entries = JSON.parse(memoRaw);
    if (Array.isArray(entries)) {
      return entries.map((e: { date: string; text: string }) => `${e.date}: ${e.text}`).join("\n");
    }
    return memoRaw;
  } catch {
    return memoRaw;
  }
}

function buildThankYouPrompt(senderInfo: string, recipientInfo: string, hasCompanyInfo: boolean, meetingMemo: string): string {
  return `あなたはB2B営業のプロとして、名刺交換後のお礼メールを作成してください。

【送信者情報】
${senderInfo}

【受信者情報】
${recipientInfo}
${meetingMemo ? `\n【商談・会話の内容】\n${meetingMemo}\n上記の内容を踏まえて、相手の課題や関心事に自然に触れたメールを生成してください。` : ""}

【作成ルール】
- 徹底的に「です・ます調＋敬語」
- 押し売り感ゼロ、関係構築重視
- 相手の会社名・役職を必ず自然に入れる
- 件名は25文字以内
- 「AIが書いた感」が出ないよう人間らしい自然な表現を使う
${hasCompanyInfo ? "- 相手の事業内容に自然に触れる一文を入れる（例:「〇〇分野でご活躍とのこと、」）" : ""}

【書き出しのルール】
- 本文は必ず「先日は〇〇にてお時間をいただき、誠にありがとうございました。」または「先日はご挨拶の機会をいただき、ありがとうございました。」から始めること

【絶対に使ってはいけない表現】
- 「お疲れ様でございます」「お疲れ様です」「ご苦労様です」（社内用語のため社外メールでは不適切）

JSONのみ出力してください（コードブロック・説明文不要）:
{
  "subjects": ["件名A（25文字以内）","件名B（25文字以内）","件名C（25文字以内）"],
  "bodies": ["本文A","本文B","本文C"],
  "followups": [
    {"timing":"3日後","body":"フォローアップ本文A"},
    {"timing":"7日後","body":"フォローアップ本文B"}
  ]
}`;
}

function buildColdDmPrompt(senderInfo: string, recipientInfo: string, hasCompanyInfo: boolean, meetingMemo: string): string {
  return `あなたはB2B営業のプロとして、まだ面識のない見込み客へ送るコールドメール（新規アプローチDM）を作成してください。

【送信者情報】
${senderInfo}

【受信者情報】
${recipientInfo}
${meetingMemo ? `\n【商談・会話の内容】\n${meetingMemo}\n上記の内容を踏まえて、相手の課題や関心事に自然に触れたメールを生成してください。` : ""}

【作成ルール】
- 押し売り感ゼロ・短め（200〜350文字）・読みやすさ重視
- 件名は興味を引くが誇大にならない（25文字以内）
- 送信者のサービスを一文で簡潔に紹介する
- 返信を促す具体的なCTA（例: 15分のお時間をいただけませんか？）を入れる
- 「AIが書いた感」が出ないよう自然な表現を使う
${hasCompanyInfo ? "- 相手の事業内容に関連づけて、なぜアプローチしたかを一文入れる" : ""}
- フォローアップは1週間後想定で、より短く・ライトなトーンで

【書き出しのルール】
- 本文は必ず「突然のご連絡失礼いたします。」から始めること

【絶対に使ってはいけない表現】
- 「お疲れ様でございます」「お疲れ様です」「ご苦労様です」（社内用語のため社外メールでは不適切）

JSONのみ出力してください（コードブロック・説明文不要）:
{
  "subjects": ["件名A（25文字以内）","件名B（25文字以内）","件名C（25文字以内）"],
  "bodies": ["本文A","本文B","本文C"],
  "followups": [
    {"timing":"7日後","body":"フォローアップ本文A"},
    {"timing":"14日後","body":"フォローアップ本文B"}
  ]
}`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "しばらく待ってから再度お試しください（1分間に5回まで）" },
        { status: 429 }
      );
    }

    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan, monthly_usage, usage_reset_date, full_name, company_name, job_title, service_description, industry, proposal_goal, use_case, use_signature, email_signature")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const resetDate = profile.usage_reset_date;
    let currentUsage = profile.monthly_usage;
    if (today.slice(0, 7) > resetDate?.slice(0, 7)) {
      await serviceClient
        .from("profiles")
        .update({ monthly_usage: 0, usage_reset_date: today })
        .eq("id", user.id);
      currentUsage = 0;
    }

    const limit = PLAN_LIMITS[profile.plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free;
    if (currentUsage >= limit) {
      return NextResponse.json(
        { error: "LIMIT_EXCEEDED", plan: profile.plan, limit },
        { status: 403 }
      );
    }

    const { contact, meetingMemo = "" } = await request.json();

    const senderInfo = [
      profile.full_name && `送信者名: ${profile.full_name}`,
      profile.company_name && `所属会社: ${profile.company_name}`,
      profile.job_title && `役職: ${profile.job_title}`,
      profile.service_description && `提供サービス: ${profile.service_description}`,
      profile.industry && `業種: ${profile.industry}`,
      profile.proposal_goal && `提案目的: ${profile.proposal_goal}`,
    ].filter(Boolean).join("\n");

    const memoText = formatMemo(contact.memo);
    const recipientInfo = [
      `宛先氏名: ${contact.name}`,
      contact.company && `宛先会社: ${contact.company}`,
      contact.address && `所在地: ${contact.address}`,
      contact.title && `宛先役職: ${contact.title}`,
      contact.company_description && `会社情報: ${contact.company_description}`,
      memoText && `メモ: ${memoText}`,
    ].filter(Boolean).join("\n");

    const hasCompanyInfo = !!contact.company_description;
    const useCase = profile.use_case ?? "thank_you";

    const prompt = useCase === "cold_dm"
      ? buildColdDmPrompt(senderInfo, recipientInfo, hasCompanyInfo, meetingMemo)
      : buildThankYouPrompt(senderInfo, recipientInfo, hasCompanyInfo, meetingMemo);

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "生成に失敗しました。もう一度お試しください" }, { status: 422 });
    }

    const result = JSON.parse(jsonMatch[0]);

    // 署名を本文末尾に付加
    if (profile.use_signature && profile.email_signature?.trim()) {
      const sig = `\n\n${profile.email_signature.trim()}`;
      result.bodies = result.bodies.map((b: string) => b + sig);
      result.followups = result.followups.map((f: { timing: string; body: string }) => ({
        ...f,
        body: f.body + sig,
      }));
    }

    await serviceClient
      .from("profiles")
      .update({ monthly_usage: currentUsage + 1 })
      .eq("id", user.id);

    if (contact.id) {
      await serviceClient.from("generated_emails").insert({
        user_id: user.id,
        contact_id: contact.id,
        subjects: result.subjects,
        bodies: result.bodies,
        followups: result.followups,
        use_case: useCase,
      });
    }

    return NextResponse.json({
      ...result,
      remainingUsage: limit - currentUsage - 1,
      use_case: useCase,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "生成に失敗しました。もう一度お試しください" },
      { status: 500 }
    );
  }
}
