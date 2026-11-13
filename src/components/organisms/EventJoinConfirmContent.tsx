"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { EventDetailType } from "@/components/molecules/event-detail/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BACK_LINK_LABELS } from "@/constants/labels";
import { useEventJoinConfirm } from "@/hooks/useEventJoinConfirm";
import { getEventDetail } from "@/services/event";

type EventJoinConfirmContentProps = {
  eventId: string;
  // 確認メールのリンクに含まれる確認トークン（?token=...）。
  token: string;
};

// 申込確認画面のクライアント側エントリーポイント。
//
// 確認メールのリンクから開かれ、トークンでゲスト申込（pending）を確定する。
// 単回使用トークンをメールクライアントの先読みで消費しないよう、
// 自動確定はせずボタン操作で確定する。
export function EventJoinConfirmContent({
  eventId,
  token,
}: Readonly<EventJoinConfirmContentProps>) {
  const { status, errorMessage, confirm } = useEventJoinConfirm({
    eventId,
    token,
  });
  const [event, setEvent] = useState<EventDetailType | null>(null);

  // 確定前に何のイベントへ申し込むのかを確認できるよう、イベント情報を取得する。
  // 取得に失敗しても確定操作自体は妨げないため、エラー表示にはしない。
  useEffect(() => {
    let cancelled = false;

    const fetchEvent = async (): Promise<void> => {
      try {
        const detail = await getEventDetail(eventId);
        if (!cancelled) {
          setEvent(detail);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("イベント情報の取得に失敗しました", error);
        }
      }
    };

    void fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const eventDetailPath = `/event/${encodeURIComponent(eventId)}`;

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-5 py-8">
      <h1 className="text-center text-xl font-bold text-slate-900">
        参加申込の確認
      </h1>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-6 px-6 py-8">
          {event ? <EventSummary event={event} /> : null}

          <div aria-live="polite">
            {status === "success" ? (
              <div className="flex flex-col items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-(--brand-green) text-white"
                >
                  <Check className="h-8 w-8" strokeWidth={3} />
                </span>

                <p className="text-xl font-bold text-slate-900">
                  申込が確定しました
                </p>

                <p className="text-center text-sm text-slate-600">
                  イベントへの参加が確定しました。当日のご参加をお待ちしています。
                </p>
              </div>
            ) : status === "error" ? (
              <div className="flex flex-col items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600"
                >
                  <X className="h-8 w-8" strokeWidth={3} />
                </span>

                <p className="text-xl font-bold text-slate-900">
                  申込を確定できませんでした
                </p>

                {errorMessage ? (
                  <p className="text-center text-sm leading-relaxed text-slate-600">
                    {errorMessage}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm leading-relaxed text-slate-700">
                  以下のイベントへの参加申込を確定します。内容をご確認のうえ、確定ボタンを押してください。
                </p>

                <Button
                  type="button"
                  className="w-full"
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

// 確定対象のイベント概要。申込先を取り違えないよう、タイトルだけを簡潔に出す。
function EventSummary({ event }: Readonly<{ event: EventDetailType }>) {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">申込先のイベント</p>

      <h2 className="break-words text-base font-bold text-slate-900">
        {event.title}
      </h2>
    </div>
  );
}
