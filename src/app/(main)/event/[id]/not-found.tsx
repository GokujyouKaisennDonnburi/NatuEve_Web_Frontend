import { ROUTES } from "@/constants/routes";
import Link from "next/link";

// 存在しないイベント ID が指定されたときの 404 表示。
export default function EventDetailNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h1 className="text-lg font-bold text-slate-800">
        イベントが見つかりません。
      </h1>
      <Link
        href={ROUTES.EVENT_LIST}
        className="text-sm text-emerald-700 underline transition hover:opacity-80"
      >
        イベント一覧へ
      </Link>
    </div>
  );
}
