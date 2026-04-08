import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { scrapeUrl } from "@/lib/firecrawl";
import { NextResponse } from "next/server";
import { CompanyInfo } from "@/types";

export async function POST(request: Request) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { company, url } = await request.json() as { company: string; url?: string };

    if (!company?.trim()) {
      return NextResponse.json({ error: "会社名が空です" }, { status: 400 });
    }

    // URLがある場合はFirecrawlでサイト取得
    let siteContent = "情報なし";
    if (url?.trim()) {
      console.log("[company] Received URL:", url.trim());
      try {
        const markdown = await scrapeUrl(url.trim());
        console.log("[company] Firecrawl response:", markdown ? `OK (${markdown.length} chars)` : "null/empty");
        if (markdown) {
          console.log("[company] Markdown preview:", markdown.slice(0, 200));
          siteContent = markdown;
        }
      } catch (firecrawlError) {
        console.error("[company] Firecrawl error:", firecrawlError);
      }
    }

    // Claudeで会社情報を抽出・推測
    const prompt = `以下の情報から、この会社の所在地（都道府県）・業種・事業内容を日本語で1文（40文字以内）にまとめてください。確信が持てない場合はis_estimatedをtrueにしてください。

会社名: ${company}
サイト内容: ${siteContent}

JSONのみ出力してください（コードブロック・説明文不要）:
{"location":"東京都","industry":"ITサービス","summary":"中小企業向けのクラウド会計ソフトを提供する会社","is_estimated":false}`;

    console.log("[company] Claude input:", prompt.slice(0, 200));

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    console.log("[company] Claude output:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "会社情報を取得できませんでした" }, { status: 422 });
    }

    const result: CompanyInfo = JSON.parse(jsonMatch[0]);
    console.log("[company] Result:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Company info error:", error);
    return NextResponse.json({ error: "会社情報を取得できませんでした" }, { status: 500 });
  }
}
