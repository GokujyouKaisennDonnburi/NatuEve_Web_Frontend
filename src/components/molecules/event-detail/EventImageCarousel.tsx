"use client";

import { normalizeAssetUrl } from "@/utils/media";
import Image from "next/image";
import * as React from "react";

// イベント画像カルーセルコンポーネントのプロパティ型定義
type EventImageCarouselProps = {
  images: string[];
};

// イベント画像カルーセルコンポーネント
export function EventImageCarousel({
  images,
}: Readonly<EventImageCarouselProps>) {
  // 選択された画像のインデックスを管理する状態
  const [selected, setSelected] = React.useState(0);
  const mainImage = normalizeAssetUrl(images[selected] ?? "");

  // 画像が存在しない場合はプレースホルダーを表示
  if (!mainImage) {
    return (
      <div
        className="h-56 w-full rounded-xl bg-slate-100"
        role="img"
        aria-label="画像はありません"
      />
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl shadow-sm">
      <div className="relative aspect-16/7 w-full overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={mainImage}
          alt="イベント画像"
          fill
          className="object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, index) => (
            <button
              type="button"
              key={src}
              onClick={() => setSelected(index)}
              aria-label={`サムネイル ${index + 1}`}
              className={`h-16 w-28 shrink-0 overflow-hidden rounded-md border ${
                index === selected ? "border-emerald-400" : "border-slate-200"
              }`}
            >
              <Image
                src={normalizeAssetUrl(src)}
                alt={`イベント画像 サムネイル ${index + 1}`}
                width={112}
                height={64}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
