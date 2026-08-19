"use client";

import { cn } from "@/lib/utils";
import { Fragment } from "react";

// 申込日・開催日時などを縦に並べる2列テーブルの1行分
export type ParticipationDetailRow = {
  label: string;
  value: string;
};

type ParticipationDetailTableProps = {
  rows: ParticipationDetailRow[];
};

// 申し込み内容モーダルで使う、ラベルと値を並べた2列テーブル
export function ParticipationDetailTable({
  rows,
}: Readonly<ParticipationDetailTableProps>) {
  return (
    <dl className="grid grid-cols-[7.5rem_1fr] overflow-hidden rounded-xl border border-slate-200">
      {rows.map((row, index) => (
        <Fragment key={row.label}>
          <dt
            className={cn(
              "bg-(--surface-muted) px-4 py-3 text-sm font-bold text-slate-700",
              index > 0 && "border-t border-slate-200",
            )}
          >
            {row.label}
          </dt>
          <dd
            className={cn(
              "px-4 py-3 text-sm text-slate-800",
              index > 0 && "border-t border-slate-200",
            )}
          >
            {row.value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
