// 投稿画面の参加費用欄の下に表示する、支払い方法に関する警告メッセージを表示するコンポーネント
// このサイト経由で決済を行えない旨を補足し、概要欄への支払い方法の記入を促す目的で配置する

export function PaymentAlertNote() {
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
        <p>このサイト経由でのお支払いに対応していません。</p>
        <p>必ず概要にお支払い方法を記入してください。</p>
      </div>
    </div>
  );
}
