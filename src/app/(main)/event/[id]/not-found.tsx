import { ROUTES } from "@/constants/routes";
import Link from "next/link";

// 存在しないイベント ID が指定されたときの 404 表示。
export default function EventDetailNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <p className="text-slate-500">イベントが見つかりません。</p>
      <Link
        href={ROUTES.EVENT_LIST}
        className="text-sm text-emerald-600 hover:underline"
      >
        イベント一覧へ
      </Link>
    </div>
  );
}
