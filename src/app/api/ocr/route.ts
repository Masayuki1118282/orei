import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";
import { OcrResult } from "@/types";

export async function POST(request: Request) {
  try {
    // 認証チェック
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `この名刺画像から情報を抽出してください。
JSONのみ出力してください（コードブロック・説明文は不要）。
読み取れなかった項目は空文字""にしてください。
addressは名刺に記載の住所から都道府県＋市区町村のみを抽出してください（例: "愛知県一宮市"）。

{"name":"","company":"","address":"","title":"","email":"","phone":"","url":""}`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // JSONパース（コードブロックが混入した場合も対応）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "読み取れませんでした" }, { status: 422 });
    }

    const result: OcrResult = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "読み取れませんでした" }, { status: 500 });
  }
}
