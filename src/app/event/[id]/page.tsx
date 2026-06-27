"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Cost = { category: string; cost: number };
type Item = { item: string; isRequired: boolean };

type EventDetail = {
  id: string;
  title: string;
  description: string;
  imageObjectKeys?: string[];
  pdfObjectKeys?: string[];
  location: string;
  eventDate: string;
  capacity?: number;
  externalUrl?: string;
  costs: Cost[];
  items?: Item[];
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error(`status:${res.status}`);
        const data = (await res.json()) as EventDetail;
        if (!cancelled) setEvent(data);
      } catch (err) {
        console.error("イベント詳細取得エラー", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>読み込み中…</div>
      </div>
    );

  if (!event)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>イベントが見つかりません。</div>
      </div>
    );

  const start = new Date(event.eventDate);
  const formatted = start.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 antialiased">
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-20">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            戻る
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{event.title}</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="mb-4 text-sm text-slate-600">{formatted}</div>
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">開催場所:</span>
              <span>{event.location}</span>
            </div>

            <div className="mb-6 text-base text-slate-800">
              {event.description}
            </div>

            {event.imageObjectKeys && event.imageObjectKeys.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">画像</h4>
                <div className="grid grid-cols-1 gap-3">
                  {event.imageObjectKeys.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt={event.title}
                      className="w-full rounded-md object-cover"
                    />
                  ))}
                </div>
              </div>
            )}

            {event.pdfObjectKeys && event.pdfObjectKeys.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">資料（PDF）</h4>
                <ul className="flex flex-col gap-2">
                  {event.pdfObjectKeys.map((url) => (
                    <li key={url}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-sm text-emerald-600 underline"
                      >
                        {url.split("/").pop()}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <h4 className="font-semibold mb-2">費用</h4>
              <ul className="list-disc list-inside">
                {event.costs.map((c) => (
                  <li key={c.category} className="text-sm text-slate-700">
                    {c.category}: ¥{c.cost.toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>

            {event.items && event.items.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">持ち物</h4>
                <ul className="list-disc list-inside">
                  {event.items.map((it) => (
                    <li key={it.item} className="text-sm text-slate-700">
                      {it.item} {it.isRequired ? "(必須)" : "(任意)"}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mb-6">
              <h4 className="font-semibold mb-2">収容人数</h4>
              <div>{event.capacity ?? "未設定"}</div>
            </div>

            {event.externalUrl && (
              <div className="mb-6">
                <h4 className="font-semibold mb-2">外部リンク</h4>
                <a
                  href={event.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 underline"
                >
                  イベントページへ
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
