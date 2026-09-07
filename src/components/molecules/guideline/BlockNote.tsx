import type { ReactNode } from "react";

type BlockNoteProps = {
  title: string;
  children: ReactNode;
};

// フォーム見本の直下に置く、対象ブロック（開催情報・参加費用など）の説明文
export function BlockNote({ title, children }: Readonly<BlockNoteProps>) {
  return (
    <div className="my-5 rounded-[14px] border border-[#DCE8C8] bg-[#FAFBF7] p-5">
      <p className="mb-2 text-sm font-bold text-[#3B5220]">{title}</p>
      <div className="space-y-1.5 text-base leading-[1.8] text-[#333]">
        {children}
      </div>
    </div>
  );
}
