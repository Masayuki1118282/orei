import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { NextResponse } from "next/server";
import { OcrResult } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const frontFile = (formData.get("frontImage") ?? formData.get("file")) as File | null;
    const backFile = formData.get("backImage") as File | null;

    if (!frontFile && !backFile) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 });
    }

    async function toBase64(file: File) {
      const buf = await file.arrayBuffer();
      return {
        data: Buffer.from(buf).toString("base64"),
        mediaType: (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      };
    }

    const imageBlocks: object[] = [];
    if (frontFile) {
      const { data, mediaType } = await toBase64(frontFile);
      imageBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
    }
    if (backFile) {
      const { data, mediaType } = await toBase64(backFile);
      imageBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
    }

    const hasBoth = !!frontFile && !!backFile;
    const promptText = hasBoth
      ? `名刺の表面と裏面の画像から情報を統合して抽出してください。裏面に追加情報や手書きメモがある場合もmemoフィールドに含めてください。
JSONのみ出力してください（コードブロック・説明文は不要）。読み取れなかった項目は空文字""にしてください。
addressは都道府県＋市区町村のみ（例: "愛知県一宮市"）。

{"name":"","company":"","address":"","title":"","email":"","phone":"","url":"","memo":""}`
      : `この名刺画像から情報を抽出してください。
JSONのみ出力してください（コードブロック・説明文は不要）。読み取れなかった項目は空文字""にしてください。
addressは都道府県＋市区町村のみ（例: "愛知県一宮市"）。

{"name":"","company":"","address":"","title":"","email":"","phone":"","url":"","memo":""}`;

    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: promptText },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
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
