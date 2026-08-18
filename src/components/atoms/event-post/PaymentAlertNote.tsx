// 支払い方法に関する警告メッセージを表示するコンポーネント
// このサイト経由で決済を行えない旨を伝える目的で、投稿画面の参加費用欄と
// 申し込みモーダルの人数選択ステップの双方で使う

// デフォルトは投稿画面向けの文言。申し込みモーダル等、別文言で使い回せるよう props で差し替え可能にする
const DEFAULT_LINES = [
  "このサイト経由でのお支払いに対応していません。",
  "必ず概要にお支払い方法を記入してください。",
];

type PaymentAlertNoteProps = {
  // 表示する文言。省略時は投稿画面向けの既定文言を表示する
  lines?: string[];
};

export function PaymentAlertNote({
  lines = DEFAULT_LINES,
}: Readonly<PaymentAlertNoteProps>) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-[#E8B84B]/40 bg-[#FEF9EC] px-5 py-4"
    >
      {/* 円形の背景に「!」マークを表示するアイコン */}
      <span
        aria-hidden="true"
        className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[#E8B84B] text-sm font-bold text-white"
      >
        !
      </span>
      <div className="space-y-1 text-sm leading-6 text-[#5C4A33]">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}
