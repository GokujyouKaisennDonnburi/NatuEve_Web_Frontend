import { Card, CardContent } from "@/components/ui/card";
import { normalizeAssetUrl } from "@/utils/media";
import { Download, FileText } from "lucide-react";

// 添付資料（PDF）リストコンポーネントのプロパティ型定義
type EventPdfListProps = {
  pdfSources: string[];
};

// 添付資料（PDF）リストコンポーネント
export function EventPdfList({ pdfSources }: Readonly<EventPdfListProps>) {
  // PDFが存在しない場合は何も表示しない
  if (pdfSources.length === 0) {
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
          {pdfSources.map((url) => (
            <a
              key={url}
              href={normalizeAssetUrl(url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-white px-4 py-3 shadow-sm hover:shadow-md"
            >
              {/* PDFファイル名の表示 */}
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-700" />
                <span className="text-sm text-slate-800">
                  {url.split("/").pop()}
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
