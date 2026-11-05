import { PAGE_TITLES } from "@/constants/pageTitles";
import { ROUTES } from "@/constants/routes";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: PAGE_TITLES.EVENT_DETAIL_NOT_FOUND,
};

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
