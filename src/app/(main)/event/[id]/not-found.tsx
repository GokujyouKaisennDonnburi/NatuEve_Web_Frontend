import { ROUTES } from "@/constants/routes";
import Link from "next/link";

// 存在しないイベント ID、または取りやめ済み（画面上は「削除」）のイベントの 404 表示。
// notFound() には ID を渡せないため、両者は表示し分けない（ADR-0008）。
export default function EventDetailNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <h1 className="text-lg font-bold text-slate-800">
        イベントが見つかりません。
      </h1>
      <p className="max-w-md text-center text-sm text-slate-600">
        イベントが削除されたか、URL が間違っている可能性があります。
      </p>
      <Link
        href={ROUTES.EVENT_LIST}
        className="text-sm text-emerald-700 underline transition hover:opacity-80"
      >
        イベント一覧へ
      </Link>
      {process.env.NODE_ENV === "development" &&
      process.env.NEXT_PUBLIC_USE_MSW === "true" ? (
        <p className="max-w-md text-center text-sm text-slate-500">
          開発時の MSW
          では、ブラウザで新規作成したイベントはサーバー側に存在しないため、この画面が表示されます。実
          API モードで確認してください。
        </p>
      ) : null}
    </div>
  );
}
