"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BACK_LINK_LABELS } from "@/constants/labels";
import { useEventJoinConfirm } from "@/hooks/useEventJoinConfirm";
import type { ConfirmJoinResponse } from "@/types/participate";

type EventJoinConfirmContentProps = {
  eventId: string;
  // 確認メールのリンクに含まれる確認トークン（?token=...）。
  token: string;
};

// 確定操作のCTA。申し込みボタン（EventParticipationButton の APPLY_BUTTON_CLASS）と
// 同じ緑塗りpillの系統に揃える。高さは既存CTAと同じ h-10 sm:h-11。
const CONFIRM_BUTTON_CLASS =
  "h-10 w-full rounded-full bg-[#9ABD5A] font-bold text-[#173315] hover:bg-[#A5C869] disabled:cursor-not-allowed disabled:bg-[#C5D9A3] disabled:opacity-100 disabled:hover:bg-[#C5D9A3] sm:h-11";

// 再試行ボタン。確定ボタンより落ち着いた深みのある緑にして、
// 補助的な再試行操作であることを区別する。
const RETRY_BUTTON_CLASS =
  "h-10 w-full rounded-full bg-[#315E26] font-bold text-white hover:bg-[#3D6E31] sm:h-11";

// 申込確認画面のクライアント側エントリーポイント。
//
// 確認メールのリンクから開かれ、トークンでゲスト申込（pending）を確定する。
// 単回使用トークンをメールクライアントの先読みで消費しないよう、
// 自動確定はせずボタン操作で確定する。
export function EventJoinConfirmContent({
  eventId,
  token,
}: Readonly<EventJoinConfirmContentProps>) {
  const { status, errorMessage, result, event, confirm, canRetry } =
    useEventJoinConfirm({
      eventId,
      token,
    });

  const eventDetailPath = `/event/${encodeURIComponent(eventId)}`;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-5 py-6 sm:py-8">
      <h1 className="text-center text-lg font-bold text-slate-900 sm:text-xl">
        参加申込の確認
      </h1>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 px-4 py-6 sm:space-y-6 sm:px-6 sm:py-8">
          {event ? <EventSummary event={event} /> : null}

          <div aria-live="polite">
            {status === "success" ? (
              <div className="flex flex-col items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-(--brand-green) text-white sm:h-16 sm:w-16"
                >
                  <Check className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={3} />
                </span>

                <p className="text-lg font-bold text-slate-900 sm:text-xl">
                  申込が確定しました
                </p>

                <p className="text-center text-sm text-slate-600">
                  イベントへの参加が確定しました。当日のご参加をお待ちしています。
                </p>

                {result ? <ConfirmedJoinContent result={result} /> : null}
              </div>
            ) : status === "error" ? (
              <div className="flex flex-col items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 sm:h-16 sm:w-16"
                >
                  <X className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={3} />
                </span>

                <p className="text-lg font-bold text-slate-900 sm:text-xl">
                  申込を確定できませんでした
                </p>

                {errorMessage ? (
                  <p className="text-center text-sm leading-relaxed text-slate-600">
                    {errorMessage}
                  </p>
                ) : null}

                {canRetry ? (
                  <Button
                    type="button"
                    className={RETRY_BUTTON_CLASS}
                    onClick={confirm}
                  >
                    もう一度確定する
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-slate-700">
                  以下のイベントへの参加申込を確定します。内容をご確認のうえ、確定ボタンを押してください。
                </p>

                <Button
                  type="button"
                  className={CONFIRM_BUTTON_CLASS}
                  disabled={status === "submitting"}
                  onClick={confirm}
                >
                  {status === "submitting"
                    ? "確定しています…"
                    : "申込を確定する"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Link
          href={eventDetailPath}
          className="text-sm text-emerald-700 underline underline-offset-2 transition hover:opacity-80"
        >
          {BACK_LINK_LABELS.EVENT_DETAIL}
        </Link>
      </div>
    </section>
  );
}

// 確定した申込内容。カテゴリごとの人数と合計を表示する。
function ConfirmedJoinContent({
  result,
}: Readonly<{ result: ConfirmJoinResponse }>) {
  return (
    <div className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <p className="text-xs font-semibold text-slate-500">申込内容</p>

      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {result.participants.map((participant) => (
          <li
            key={participant.category}
            className="flex items-center justify-between gap-3"
          >
            <span className="break-words">{participant.category}</span>
            <span className="shrink-0">{participant.headCount}名</span>
          </li>
        ))}
      </ul>

      <p className="mt-2 flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-sm font-semibold text-slate-800">
        <span>合計</span>
        <span>{result.partySize}名</span>
      </p>
    </div>
  );
}

// 確定対象のイベント概要。申込先を取り違えないよう、タイトルだけを簡潔に出す。
function EventSummary({ event }: Readonly<{ event: EventDetailType }>) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3 sm:p-4">
      <p className="text-xs font-semibold text-slate-500">申込先のイベント</p>

      <h2 className="break-words text-base font-bold text-slate-900">
        {event.title}
      </h2>
    </div>
  );
}
