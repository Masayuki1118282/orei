import Anthropic from "@anthropic-ai/sdk";

// サーバーサイドのみ使用可能
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODEL = "claude-sonnet-4-20250514";
