"use client";

import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function getVisiblePages(current: number, total: number): number[] {
  const pages: number[] = [];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: Readonly<PaginationProps>) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    onPageChange(page);
  };

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-sm font-medium text-[#3A4237]",
        className,
      )}
    >
      {/* Previous */}
      <button
        type="button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="前のページ"
        className={cn(
          "px-2 py-1 cursor-pointer transition-colors",
          currentPage === 1
            ? "opacity-30 cursor-not-allowed"
            : "hover:text-[#272E24]",
        )}
      >
        &lt;
      </button>

      {/* First page */}
      <button
        type="button"
        onClick={() => handlePageChange(1)}
        aria-label="1ページ目"
        className={cn(
          "px-2 py-1 cursor-pointer transition-colors hover:text-[#272E24]",
          currentPage === 1 && "bg-[#97C459] text-white font-bold rounded-full px-3 py-1",
        )}
      >
        1
      </button>

      {/* Left ellipsis */}
      {visiblePages.length > 0 && visiblePages[0] > 2 && (
        <span className="px-2 py-1 select-none" aria-hidden="true">......</span>
      )}

      {/* Visible pages */}
      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => handlePageChange(page)}
          aria-label={`${page}ページ目`}
          aria-current={currentPage === page ? "page" : undefined}
          className={cn(
            "px-2 py-1 cursor-pointer transition-colors hover:text-[#272E24]",
            currentPage === page && "bg-[#97C459] text-white font-bold rounded-full px-3 py-1",
          )}
        >
          {page}
        </button>
      ))}

      {/* Right ellipsis */}
      {visiblePages.length > 0 &&
        visiblePages[visiblePages.length - 1] < totalPages - 1 && (
          <span className="px-2 py-1 select-none" aria-hidden="true">......</span>
        )}

      {/* Last page */}
      {totalPages > 1 && (
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          aria-label={`${totalPages}ページ目`}
          className={cn(
            "px-2 py-1 cursor-pointer transition-colors hover:text-[#272E24]",
            currentPage === totalPages && "bg-[#97C459] text-white font-bold rounded-full px-3 py-1",
          )}
        >
          {totalPages}
        </button>
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="次のページ"
        className={cn(
          "px-2 py-1 cursor-pointer transition-colors",
          currentPage === totalPages
            ? "opacity-30 cursor-not-allowed"
            : "hover:text-[#272E24]",
        )}
      >
        &gt;
      </button>
    </div>
  );
}