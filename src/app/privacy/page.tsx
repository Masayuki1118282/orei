import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "プライバシーポリシー | OREI",
};

export default function PrivacyPage() {
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
        <Link href="/">
          <Image src="/images/logo.svg" alt="OREI" width={104} height={33} priority />
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
          プライバシーポリシー
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--color-muted)" }}>
          最終更新日：2026年4月11日
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>1. 事業者情報</h2>
            <p>
              株式会社ソウゾウ（以下「当社」）は、本サービス「OREI」（以下「本サービス」）において取得したお客様の個人情報を、以下のポリシーに従って適切に取り扱います。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>2. 取得する情報</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>氏名・メールアドレス（アカウント登録時）</li>
              <li>名刺に記載された情報（氏名・会社名・役職・電話番号・メールアドレス・URL など）</li>
              <li>本サービスの利用履歴・生成したメールの内容</li>
              <li>お支払い情報（決済代行サービス Stripe を経由。当社はカード番号を保持しません）</li>
              <li>アクセスログ・Cookie などの利用環境情報</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>3. 利用目的</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>本サービスの提供・運営・改善</li>
              <li>AIによるメール生成処理</li>
              <li>料金の請求・決済処理</li>
              <li>サービスに関するお問い合わせへの対応</li>
              <li>利用規約違反・不正利用の調査・対応</li>
              <li>統計データの作成（個人を識別できない形式）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>4. 第三者への提供</h2>
            <p className="mb-3">
              当社は、以下の場合を除き、お客様の個人情報を第三者に提供しません。
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>お客様本人の同意がある場合</li>
              <li>法令に基づく開示が必要な場合</li>
              <li>人の生命・身体・財産の保護のために必要な場合</li>
            </ul>
            <p className="mt-3">
              なお、サービス運営上、以下の業務委託先にデータを提供する場合があります（利用目的の範囲内に限定します）。
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Supabase Inc.（データベース・認証）</li>
              <li>Anthropic, PBC（AIメール生成処理）</li>
              <li>Stripe, Inc.（決済処理）</li>
              <li>Vercel, Inc.（サービスホスティング）</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>5. AIへの情報提供について</h2>
            <p>
              メール生成時、名刺情報・商談メモ・送信者プロフィール等を Anthropic の API に送信します。当社は Anthropic のデータ利用ポリシーに従い、お客様データが AI モデルの学習に使用されないよう設定しています。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>6. データの保管・セキュリティ</h2>
            <p>
              個人情報は Supabase のセキュアな環境に暗号化して保管します。当社は不正アクセス・漏洩・改ざんを防ぐために適切な安全管理措置を講じますが、インターネット上の完全な安全性を保証するものではありません。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>7. Cookie・アクセス解析</h2>
            <p>
              本サービスは Cookie および類似の技術を使用してセッション管理・利用状況の分析を行います。ブラウザの設定により Cookie を無効にすることができますが、一部機能が利用できなくなる場合があります。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>8. お客様の権利</h2>
            <p className="mb-2">
              お客様は、ご自身の個人情報について以下の権利を有します。
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>開示・訂正・削除の請求</li>
              <li>利用停止・第三者提供停止の請求</li>
            </ul>
            <p className="mt-3">
              ご請求はメールにてお問い合わせください。合理的な期間内に対応します。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>9. 未成年者のご利用</h2>
            <p>
              本サービスは18歳未満の方のご利用を想定していません。18歳未満の方が利用されていると判明した場合、当社はアカウントを停止することがあります。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>10. ポリシーの変更</h2>
            <p>
              当社は本ポリシーを予告なく変更することがあります。変更後は本ページに掲載し、重要な変更の場合はサービス内でお知らせします。
            </p>
          </section>

          <section>
            <h2 className="font-bold text-base mb-3" style={{ color: "var(--color-primary)" }}>11. お問い合わせ</h2>
            <div className="rounded-xl p-4 space-y-1" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p>株式会社ソウゾウ</p>
              <p>担当：大塚雅之</p>
              <p>所在地：岐阜県関市下有知492-1</p>
              <p>メール：<a href="mailto:sozoosns@gmail.com" style={{ color: "var(--color-accent)" }}>sozoosns@gmail.com</a></p>
            </div>
          </section>

        </div>
      </main>

      {/* フッター */}
      <footer
        className="px-6 py-10 text-center text-xs"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <div className="flex justify-center mb-4">
          <Image src="/images/logo-white.svg" alt="OREI" width={94} height={29} />
        </div>
        <div className="flex justify-center gap-6 mb-3">
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.5)" }}>プライバシーポリシー</Link>
          <Link href="/tokushoho" style={{ color: "rgba(255,255,255,0.5)" }}>特定商取引法に基づく表記</Link>
        </div>
        <p style={{ color: "rgba(255,255,255,0.35)" }}>© 2026 OREI. All rights reserved.</p>
      </footer>
    </div>
  );
}
