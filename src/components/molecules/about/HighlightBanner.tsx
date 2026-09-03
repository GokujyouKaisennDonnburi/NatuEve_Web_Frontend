import type { ReactNode } from "react";

type HighlightBannerProps = {
  children: ReactNode;
};

// 左に緑の縁を付けた強調帯
export function HighlightBanner({ children }: Readonly<HighlightBannerProps>) {
  return (
    <div className="flex items-center gap-2 rounded-r-xl border-l-4 border-[#85A928] bg-[#EEF5DF] px-5 py-4 text-base font-bold text-[#3B5220]">
      {children}
    </div>
  );
}
