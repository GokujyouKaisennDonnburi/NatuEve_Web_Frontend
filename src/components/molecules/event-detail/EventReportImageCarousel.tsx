"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { normalizeAssetUrl } from "@/utils/media";

type EventReportImageCarouselProps = {
  images: string[];
};

// 活動レポートの画像カルーセル。
// デスクトップは1ページ3枚（横3・縦1段）、モバイルは1枚（横1）を表示し、
// 残りの画像は左右の矢印でスライド表示する。
export function EventReportImageCarousel({
  images,
}: Readonly<EventReportImageCarouselProps>) {
  // Tailwind の sm ブレークポイントと同じ閾値。
  // この幅以上で1ページに3枚（横3）を表示し、未満では1枚（横1）を表示する。
  const DESKTOP_QUERY = "(min-width: 640px)";
  const DESKTOP_IMAGES_PER_PAGE = 3;
  const MOBILE_IMAGES_PER_PAGE = 1;

  // デスクトップかモバイルかを判定するための state。
  const [isDesktop, setIsDesktop] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const update = (): void => setIsDesktop(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  if (images.length === 0) {
    return null;
  }

  const imagesPerPage = isDesktop
    ? DESKTOP_IMAGES_PER_PAGE
    : MOBILE_IMAGES_PER_PAGE;
  const pageCount = Math.max(1, Math.ceil(images.length / imagesPerPage));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleImages = images.slice(
    currentPage * imagesPerPage,
    currentPage * imagesPerPage + imagesPerPage,
  );

  return (
    <div>
      <div
        className={`grid gap-3 ${isDesktop ? "grid-cols-3" : "grid-cols-1"}`}
      >
        {visibleImages.map((url) => (
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

      {images.length > imagesPerPage ? (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="前の画像"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold text-slate-500">
            {currentPage + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
            aria-label="次の画像"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
