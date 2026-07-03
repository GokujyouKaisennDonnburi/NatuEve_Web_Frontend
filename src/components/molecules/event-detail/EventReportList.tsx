import {
  ChevronDown,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";

import { Card, CardContent } from "@/components/ui/card";
import type { ReportDetail } from "@/types/report";
import { normalizeAssetUrl } from "@/utils/media";

type EventReportListProps = {
  report?: ReportDetail | null;
};

export function EventReportList({ report }: Readonly<EventReportListProps>) {
  if (!report) {
    return null;
  }

  // 画像のソースを取得
  const imageSources = report.imageUrls?.length
    ? report.imageUrls
    : (report.imageObjectKeys ?? []);

  // PDFのソースを取得
  const pdfSources = report.pdfUrls?.length
    ? report.pdfUrls
    : (report.pdfObjectKeys ?? []);

  // 外部URL一覧（空配列で正規化）
  const externalUrls = report.externalUrls ?? [];

  return (
    <Card>
      <CardContent>
        <div className="section-title flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" />
          活動レポート
        </div>

        <div className="mt-4 space-y-4">
          <details className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>レポート</span>
                  {externalUrls.length > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      外部URL
                    </span>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(report.createdAt).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Tokyo",
                  })}
                </div>
              </div>
              <ChevronDown className="h-5 w-5 text-slate-500 transition-transform duration-200 group-open:rotate-180" />
            </summary>

            <div className="border-t border-slate-200 bg-white px-5 py-5 text-sm text-slate-700">
              {report.content ? (
                <p className="whitespace-pre-wrap rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-800">
                  {report.content}
                </p>
              ) : (
                <p className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-relaxed text-slate-800">
                  レポート本文はありません。
                </p>
              )}

              {externalUrls.length > 0 ? (
                <div className="mt-4 space-y-2">
                  {externalUrls.map((url, index) => (
                    <a
                      key={url}
                      href={normalizeAssetUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {index === 0 ? "外部レポートを開く" : url}
                    </a>
                  ))}
                </div>
              ) : null}

              {imageSources.length > 0 ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <ImageIcon className="h-4 w-4 text-slate-700" />
                    画像
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {imageSources.map((url) => (
                      <div
                        key={url}
                        className="relative h-32 w-full overflow-hidden rounded-2xl bg-slate-100"
                      >
                        <Image
                          src={normalizeAssetUrl(url)}
                          alt="レポート画像"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {pdfSources.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileText className="h-4 w-4 text-slate-700" />
                    PDF
                  </div>
                  <div className="space-y-2">
                    {pdfSources.map((url, index) => (
                      <a
                        key={url}
                        href={normalizeAssetUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-white px-4 py-3 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-700" />
                          <span className="text-sm text-slate-800">
                            {report.pdfFilenames?.[index] ||
                              url.split("/").pop()}
                          </span>
                        </div>
                        <Download className="h-4 w-4 text-emerald-600" />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
