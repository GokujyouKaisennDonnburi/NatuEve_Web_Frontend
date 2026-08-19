import { Check } from "lucide-react";

// 申し込み完了ステップ。結果だけを伝え、操作はヘッダーの閉じるボタンに任せる。
export function ParticipationCompleteStep() {
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <span
        aria-hidden="true"
        className="flex h-20 w-20 items-center justify-center rounded-full bg-(--brand-green) text-white"
      >
        <Check className="h-10 w-10" strokeWidth={3} />
      </span>

      <p className="text-xl font-bold text-slate-900">申し込みが完了しました</p>
    </div>
  );
}
