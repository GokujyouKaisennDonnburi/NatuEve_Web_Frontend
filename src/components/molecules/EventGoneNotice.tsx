"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { BACK_LINK_LABELS } from "@/constants/labels";
import { ROUTES } from "@/constants/routes";

type EventGoneNoticeProps = {
  // 補足の説明。画面ごとに、何ができなくなったのかを伝える。
  description?: string;
  // 見出しの階層。ページの h1 の下に置く画面では h2、ページの内容ごと差し替える画面では h1 にする。
  headingLevel?: "h1" | "h2";
  // 表示した時点で見出しにフォーカスを移すかどうか。
  // 表示中の内容を差し替えるとフォーカスが失われるため、支援技術に変化を伝える。
  focusOnMount?: boolean;
};

// 取りやめ済み（画面上は「削除」）のイベントを開いたときの表示（ADR-0008）。
// イベント詳細・参加申込の確定・レポート投稿で共通に使う。
// 詳細ページも 404 になるため、戻り先はイベント一覧にする。
export function EventGoneNotice({
  description,
  headingLevel = "h2",
  focusOnMount = false,
}: Readonly<EventGoneNoticeProps>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const Heading = headingLevel;

  useEffect(() => {
    if (focusOnMount) {
      headingRef.current?.focus();
    }
  }, [focusOnMount]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <Heading
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold text-slate-800 outline-none"
      >
        このイベントは削除されました。
      </Heading>
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
