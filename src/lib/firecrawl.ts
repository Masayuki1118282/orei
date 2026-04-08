// Firecrawl APIクライアント（サーバーサイドのみ）

const FIRECRAWL_ENDPOINT = "https://api.firecrawl.dev/v1/scrape";
const TIMEOUT_MS = 15000;
const MAX_CONTENT_LENGTH = 2000;

/**
 * 指定URLのWebサイト内容をMarkdownで取得する
 * 取得失敗時はnullを返す（縮退動作・エラーはユーザーに見せない）
 */
export async function scrapeUrl(url: string): Promise<string | null> {
  console.log("[firecrawl] TIMEOUT_MS:", TIMEOUT_MS);
  const apiKey = process.env.FIRECRAWL_API_KEY;
  console.log("[firecrawl] API key present:", !!apiKey, "| value:", apiKey?.slice(0, 8));
  if (!apiKey) {
    console.warn("[firecrawl] FIRECRAWL_API_KEY is not set — skipping scrape");
    return null;
  }

  const normalizedUrl = url;
  console.log("[firecrawl] normalized URL:", normalizedUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(FIRECRAWL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: normalizedUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log("[firecrawl] status:", response.status);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => response.text().catch(() => "(unreadable)"));
      console.error("[firecrawl] error response:", JSON.stringify(errorBody));
      return null;
    }

    const data = await response.json();
    console.log("[firecrawl] data keys:", Object.keys(data));
    const markdown: string = data?.data?.markdown ?? data?.markdown ?? "";
    console.log("[firecrawl] markdown length:", markdown.length);
    console.log("[firecrawl] markdown preview:", markdown.slice(0, 300));

    // 先頭2000文字に切り詰める
    return markdown.slice(0, MAX_CONTENT_LENGTH) || null;
  } catch (err) {
    // タイムアウト・ネットワークエラーはサイレントに縮退
    console.error("[firecrawl] caught error:", err);
    return null;
  }
}
