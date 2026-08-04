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
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          "px-2 py-1 cursor-pointer transition-colors",
          currentPage === 1
            ? "opacity-30 cursor-not-allowed"
            : "hover:text-[#272E24]",
        )}
      >
        &lt;&lt;
      </button>

      {/* First page */}
      <button
        type="button"
        onClick={() => onPageChange(1)}
        className={cn(
          "px-2 py-1 cursor-pointer transition-colors hover:text-[#272E24]",
          currentPage === 1 && "font-bold text-[#272E24]",
        )}
      >
        1
      </button>

      {/* Left ellipsis */}
      {visiblePages.length > 0 && visiblePages[0] > 2 && (
        <span className="px-2 py-1 select-none">......</span>
      )}

      {/* Visible pages */}
      {visiblePages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={cn(
            "px-2 py-1 cursor-pointer transition-colors hover:text-[#272E24]",
            currentPage === page && "font-bold text-[#272E24]",
          )}
        >
          {page}
        </button>
      ))}

      {/* Right ellipsis */}
      {visiblePages.length > 0 &&
        visiblePages[visiblePages.length - 1] < totalPages - 1 && (
          <span className="px-2 py-1 select-none">......</span>
        )}

      {/* Last page */}
      {totalPages > 1 && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          className={cn(
            "px-2 py-1 cursor-pointer transition-colors hover:text-[#272E24]",
            currentPage === totalPages && "font-bold text-[#272E24]",
          )}
        >
          {totalPages}
        </button>
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          "px-2 py-1 cursor-pointer transition-colors",
          currentPage === totalPages
            ? "opacity-30 cursor-not-allowed"
            : "hover:text-[#272E24]",
        )}
      >
        &gt;&gt;
      </button>
    </div>
  );
}