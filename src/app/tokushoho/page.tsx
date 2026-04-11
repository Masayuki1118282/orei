import Link from "next/link";

export const metadata = {
  title: "特定商取引法に基づく表記 | OREI",
};

export default function TokushohoPage() {
  const rows = [
    { label: "販売事業者", value: "株式会社ソウゾウ" },
    { label: "代表者", value: "大塚雅之" },
    { label: "所在地", value: "岐阜県関市下有知492-1" },
    { label: "お問い合わせ", value: "sozoosns@gmail.com", isEmail: true },
    { label: "サービス名", value: "OREI（名刺交換後のメール生成サービス）" },
    {
      label: "販売価格",
      value: "無料プラン：月5通まで無料\nPERSONAL月額プラン：¥1,980（税込）/ 月\nPERSONAL年額プラン：¥19,800（税込）/ 年",
    },
    { label: "追加費用", value: "なし（インターネット接続料金はお客様負担）" },
    { label: "支払方法", value: "クレジットカード（Visa・Mastercard・American Express・JCB）" },
    { label: "支払時期", value: "月額：ご登録月より毎月同日に自動更新\n年額：ご登録日より1年ごとに自動更新" },
    {
      label: "サービス提供時期",
      value: "お支払い完了後、即時ご利用いただけます。",
    },
    {
      label: "キャンセル・解約",
      value:
        "マイページの「プラン管理」からいつでも解約できます。解約後は当月（または当年）末日までご利用いただけます。日割り返金は行いません。",
    },
    {
      label: "返金ポリシー",
      value:
        "デジタルコンテンツの性質上、原則として返金には応じかねます。ただし、サービスの重大な不具合等により提供が困難な場合はご相談ください。",
    },
    {
      label: "動作環境",
      value:
        "最新版の Google Chrome・Safari・Firefox・Edge を推奨します。スマートフォン（iOS / Android）でもご利用いただけます。",
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--color-bg)", minHeight: "100vh" }}>
      {/* ヘッダー */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}
        >
          OREI
        </Link>
        <Link href="/" className="text-sm" style={{ color: "var(--color-muted)" }}>
          ← トップに戻る
        </Link>
      </header>

      {/* 本文 */}
      <main className="px-6 py-16 max-w-3xl mx-auto">
        <h1
          className="font-bold mb-2"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)", fontSize: "28px" }}
        >
          特定商取引法に基づく表記
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--color-muted)" }}>
          最終更新日：2026年4月11日
        </p>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="grid sm:grid-cols-[180px_1fr]"
              style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--color-border)" : "none" }}
            >
              <div
                className="px-5 py-4 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                  borderRight: "1px solid var(--color-border)",
                }}
              >
                {row.label}
              </div>
              <div
                className="px-5 py-4 text-sm whitespace-pre-wrap"
                style={{ color: "var(--color-text)", backgroundColor: "#fff" }}
              >
                {row.isEmail ? (
                  <a href={`mailto:${row.value}`} style={{ color: "var(--color-accent)" }}>
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs" style={{ color: "var(--color-muted)", lineHeight: "1.8" }}>
          本表記に関するお問い合わせは <a href="mailto:sozoosns@gmail.com" style={{ color: "var(--color-accent)" }}>sozoosns@gmail.com</a> までご連絡ください。
        </p>
      </main>

      {/* フッター */}
      <footer
        className="px-6 py-8 text-center text-xs"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/privacy" style={{ color: "var(--color-muted)" }}>プライバシーポリシー</Link>
          <Link href="/tokushoho" style={{ color: "var(--color-muted)" }}>特定商取引法に基づく表記</Link>
        </div>
        <p>© 2026 OREI. All rights reserved.</p>
      </footer>
    </div>
  );
}
