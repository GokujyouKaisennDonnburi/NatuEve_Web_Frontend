import { SurfaceCard } from "@/components/molecules/SurfaceCard";
import { CardContent } from "@/components/ui/card";
import { normalizeAssetUrl } from "@/utils/media";
import { FileText } from "lucide-react";

// 添付資料（PDF）1件分。source は表示/DL先（URL または objectKey）、
// filename は表示ラベルに使う元ファイル名（空ならURLの末尾にフォールバック）。
export type EventPdfItem = {
  source: string;
  filename: string;
};

// 添付資料（PDF）リストコンポーネントのプロパティ型定義
type EventPdfListProps = {
  pdfItems: EventPdfItem[];
};

// 添付資料（PDF）リストコンポーネント
export function EventPdfList({ pdfItems }: Readonly<EventPdfListProps>) {
  // PDFが存在しない場合は何も表示しない
  if (pdfItems.length === 0) {
    return null;
  }

  return (
    <SurfaceCard>
      <CardContent>
        {/* セクションタイトル */}
        <h2 className="section-title">添付資料</h2>

        {/* PDFリストの表示 */}
        <div className="space-y-3">
          {pdfItems.map(({ source, filename }, index) => (
            <a
              key={source || `${filename}-${index}`}
              href={normalizeAssetUrl(source)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 hover:shadow-md"
            >
              {/* PDFファイル名の表示（元ファイル名。無ければURL末尾にフォールバック） */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                  <FileText className="h-5 w-5 text-red-400" />
                </div>
                <span className="truncate text-sm font-bold text-slate-800">
                  {filename || source.split("/").pop()}
                </span>
              </div>

              {/* 「開く」ボタン（見た目のみ。実際のリンクは行全体の<a>が担う） */}
              <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700">
                開く
              </span>
            </a>
          ))}
        </div>
      </CardContent>
    </SurfaceCard>
  );
}
