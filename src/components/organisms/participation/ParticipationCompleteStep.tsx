import { Check } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";

type ParticipationCompleteStepProps = {
  // ゲスト申込かどうか。ゲストは未確定（pending）で保存されるため、
  // 完了ではなく確認メールの送信を伝える（ADR-0049）。
  isGuest: boolean;
};

// 申し込み完了ステップ。結果だけを伝え、操作はヘッダーの閉じるボタンに任せる。
export function ParticipationCompleteStep({
  isGuest,
}: Readonly<ParticipationCompleteStepProps>) {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <span
        aria-hidden="true"
        className="flex h-20 w-20 items-center justify-center rounded-full bg-(--brand-green) text-white"
      >
        <Check className="h-10 w-10" strokeWidth={3} />
      </span>

      {isGuest ? (
        <>
          <p className="rounded-xl border border-(--brand-green-line) bg-(--brand-green-soft) px-5 py-4 text-center text-sm font-bold leading-relaxed text-(--brand-green-text)">
            メール内のリンクから参加申込を確定してください。
          </p>
          <p className="text-center text-sm text-slate-600">
            ご不明点がある場合は
            <Link
              href={ROUTES.CONTACT}
              className="text-emerald-700 underline underline-offset-2 transition hover:opacity-80"
            >
              お問い合わせ
            </Link>
            ください。
          </p>
        </>
      ) : (
        <p className="text-xl font-bold text-slate-900">
          申し込みが完了しました
        </p>
      )}
    </div>
  );
}
