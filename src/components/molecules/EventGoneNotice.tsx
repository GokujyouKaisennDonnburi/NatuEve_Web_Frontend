import Link from "next/link";

import { BACK_LINK_LABELS } from "@/constants/labels";
import { ROUTES } from "@/constants/routes";

type EventGoneNoticeProps = {
  // 補足の説明。画面ごとに、何ができなくなったのかを伝える。
  description?: string;
};

// 取りやめ済み（画面上は「削除」）のイベントを開いたときの表示（ADR-0008）。
// イベント詳細・参加申込の確定・レポート投稿で共通に使う。
// 詳細ページも 404 になるため、戻り先はイベント一覧にする。
export function EventGoneNotice({
  description,
}: Readonly<EventGoneNoticeProps>) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-4 py-16"
    >
      {/* 確定ページ・レポート投稿の h1 の下でも階層が崩れないよう h2 にする。 */}
      <h2 className="text-lg font-bold text-slate-800">
        このイベントは削除されました。
      </h2>
      {description ? (
        <p className="max-w-md text-center text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      ) : null}
      <Link
        href={ROUTES.EVENT_LIST}
        className="text-sm text-emerald-700 underline transition hover:opacity-80"
      >
        {BACK_LINK_LABELS.EVENT_LIST}
      </Link>
    </div>
  );
}
