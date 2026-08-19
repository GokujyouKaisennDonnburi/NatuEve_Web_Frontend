import { Pencil } from "lucide-react";

// 人数欄が +/- だけでなく直接入力もできることを伝えるヒント。
// 入力欄の枠だけでは気づかれにくいため、見出しの横に添えて明示する。
export function DirectInputHint() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-(--brand-green-soft) px-3 py-1.5 text-xs font-medium text-(--brand-green-text)">
      <Pencil className="h-3.5 w-3.5" />
      数字は直接入力もできます
    </span>
  );
}
