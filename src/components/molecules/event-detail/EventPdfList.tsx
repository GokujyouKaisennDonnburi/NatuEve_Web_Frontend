import { Card, CardContent } from "@/components/ui/card";
import { normalizeAssetUrl } from "@/utils/media";
import { Download, FileText } from "lucide-react";

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
    <Card>
      <CardContent>
        {/* セクションタイトル */}
        <h2 className="section-title flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" /> 添付資料
        </h2>

        {/* PDFリストの表示 */}
        <div className="space-y-2">
          {pdfItems.map(({ source, filename }) => (
            <a
              key={source}
              href={normalizeAssetUrl(source)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-white px-4 py-3 shadow-sm hover:shadow-md"
            >
              {/* PDFファイル名の表示（元ファイル名。無ければURL末尾にフォールバック） */}
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-700" />
                <span className="text-sm text-slate-800">
                  {filename || source.split("/").pop()}
                </span>
              </div>

              {/* ダウンロードアイコン */}
              <Download className="h-4 w-4 text-emerald-600" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
