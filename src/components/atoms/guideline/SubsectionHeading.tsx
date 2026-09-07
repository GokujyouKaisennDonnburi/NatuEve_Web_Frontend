import type { ReactNode } from "react";

type SubsectionHeadingProps = {
  number: string;
  children: ReactNode;
};

// ガイドライン画面の各セクション内に置く番号付きの小見出し（3.1 など）
export function SubsectionHeading({
  number,
  children,
}: Readonly<SubsectionHeadingProps>) {
  return (
    <h3 className="mb-4 flex items-center gap-2.5 text-xl font-bold text-[#2D401A]">
      <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#EEF5DF] px-2 text-sm font-black text-[#5C781E]">
        {number}
      </span>
      {children}
    </h3>
  );
}
