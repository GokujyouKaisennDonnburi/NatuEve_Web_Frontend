import {
  ExternalLink,
  FilePlus2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { PillButton } from "@/components/atoms/PillButton";
import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import { CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { ReportDetail } from "@/types/report";
import { normalizeAssetUrl } from "@/utils/media";

type EventReportListProps = {
  report?: ReportDetail | null;
  // 「レポートを作成」ボタンからレポート投稿画面へ遷移するためのイベントID。
  eventId?: string;
  // 主催者（ログイン中のユーザー＝投稿者）のときだけ「レポートを作成」ボタンを表示する。
  isOrganizer?: boolean;
};

// 投稿日時を「投稿日時 YYYY年M月D日」形式で表示する。
const formatReportDate = (value: string): string =>
  `投稿日時 ${new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  })}`;

type EmptyReportCardProps = {
  eventId?: string;
  isOrganizer?: boolean;
};

// レポート未投稿の空状態。主催者にはレポート作成画面への導線を表示する。
function EmptyReportCard({
  eventId,
  isOrganizer,
}: Readonly<EmptyReportCardProps>) {
  const reportPostUrl = eventId
    ? `${ROUTES.REPORT_POST}?eventId=${encodeURIComponent(eventId)}`
    : ROUTES.REPORT_POST;

  return (
    <SurfaceCard>
      <CardContent>
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <FileText className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="mt-5 text-base font-bold text-slate-900">
            まだ活動レポートがありません
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            開催後にレポートを作成すると、参加者や閲覧者に活動の様子を届けられます。
          </p>
          {isOrganizer ? (
            <PillButton asChild tone="brand" className="mt-6">
              <Link href={reportPostUrl}>
                <FilePlus2 className="h-4 w-4" />
                レポートを作成
              </Link>
            </PillButton>
          ) : null}
        </div>
      </CardContent>
    </SurfaceCard>
  );
}

type ExternalReportCardProps = {
  externalUrls: string[];
};

// 外部サイトでレポートを公開している場合の専用カード。
function ExternalReportCard({
  externalUrls,
}: Readonly<ExternalReportCardProps>) {
  return (
    <SurfaceCard>
      <CardContent>
        <div className="flex flex-col items-center px-4 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <ExternalLink className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="mt-5 text-sm leading-relaxed text-slate-600">
            レポートは主催者のサイトで公開されています
          </p>
          <div className="mt-4 w-full max-w-md space-y-2">
            {externalUrls.map((url) => (
              <a
                key={url}
                href={normalizeAssetUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500 hover:bg-slate-100"
              >
                {url}
              </a>
            ))}
          </div>
          <PillButton asChild tone="brand" className="mt-6">
            <a
              href={normalizeAssetUrl(externalUrls[0])}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              レポートを読む
            </a>
          </PillButton>
        </div>
      </CardContent>
    </SurfaceCard>
  );
}

type ReportCardProps = {
  report: ReportDetail;
  imageSources: string[];
  pdfSources: string[];
};

// 通常の活動レポート（本文・画像・PDF）。
function ReportCard({
  report,
  imageSources,
  pdfSources,
}: Readonly<ReportCardProps>) {
  return (
    <SurfaceCard>
      <CardContent>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <FileText className="h-5 w-5 text-emerald-500" />
          活動レポート
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          {formatReportDate(report.createdAt)}
        </p>

        <div className="mt-5 space-y-6">
          {report.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
              {report.content}
            </p>
          ) : (
            <p className="text-sm text-slate-500">レポート本文はありません。</p>
          )}

          {imageSources.length > 0 ? (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ImageIcon className="h-4 w-4 text-slate-700" />
                画像
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {imageSources.map((url) => (
                  <div
                    key={url}
                    className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-slate-100"
                  >
                    <Image
                      src={normalizeAssetUrl(url)}
                      alt="レポート画像"
                      fill
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {pdfSources.length > 0 ? (
            <section>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FileText className="h-4 w-4 text-slate-700" />
                PDF
              </h3>
              <div className="mt-3 space-y-2">
                {pdfSources.map((url, index) => (
                  <a
                    key={url}
                    href={normalizeAssetUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                        <FileText className="h-5 w-5 text-red-400" />
                      </div>
                      <span className="truncate text-sm font-bold text-slate-800">
                        {report.pdfFilenames?.[index] || url.split("/").pop()}
                      </span>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
                      <ExternalLink className="h-3.5 w-3.5" />
                      開く
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </CardContent>
    </SurfaceCard>
  );
}

export function EventReportList({
  report,
  eventId,
  isOrganizer,
}: Readonly<EventReportListProps>) {
  if (!report) {
    return <EmptyReportCard eventId={eventId} isOrganizer={isOrganizer} />;
  }

  const externalUrls = report.externalUrls ?? [];

  if (externalUrls.length > 0) {
    return <ExternalReportCard externalUrls={externalUrls} />;
  }

  const imageSources = report.imageUrls?.length
    ? report.imageUrls
    : (report.imageObjectKeys ?? []);
  const pdfSources = report.pdfUrls?.length
    ? report.pdfUrls
    : (report.pdfObjectKeys ?? []);

  return (
    <ReportCard
      report={report}
      imageSources={imageSources}
      pdfSources={pdfSources}
    />
  );
}
