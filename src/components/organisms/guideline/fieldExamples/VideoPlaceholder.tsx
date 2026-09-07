import { PlayCircle } from "lucide-react";

import { Badge } from "@/components/atoms/Badge";

const EXAMPLE_TAGS = ["海", "親子向け", "社会貢献"];

// 3.2 のタグ入力・追加欄の動画を掲載する予定の仮枠。
// 完成した動画に差し替える前提で、設定例のタグを実フォームと同じチップの見た目で併記する。
export function VideoPlaceholder() {
  return (
    <div className="my-5 rounded-xl border-2 border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <PlayCircle className="size-10 text-[#85A928]" />
        <p className="text-sm font-bold text-[#3B5220]">
          動画挿入予定：タグ入力・追加欄
        </p>
        <ul
          className="flex flex-wrap justify-center gap-2"
          aria-label="設定例のタグ"
        >
          {EXAMPLE_TAGS.map((tag) => (
            <li key={tag}>
              <Badge
                tone="subtle"
                className="bg-(--brand-green-soft) font-medium text-(--brand-green-text)"
              >
                {tag}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#85A928]">
          ※動画は仮です。後日に差し替えます
        </p>
      </div>
    </div>
  );
}
