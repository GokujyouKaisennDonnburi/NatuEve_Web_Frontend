import type { ReactNode } from "react";

type EmptyMessageProps = {
  children: ReactNode;
};

export function EmptyMessage({ children }: EmptyMessageProps) {
  return (
    <div className="text-center text-sm text-slate-500 py-12 bg-white/50 rounded-lg border border-slate-200/50 border-dashed">
      {children}
    </div>
  );
}
