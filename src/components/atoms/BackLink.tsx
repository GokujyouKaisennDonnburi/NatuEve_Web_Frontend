import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type BackLinkProps = {
  href: ComponentPropsWithoutRef<typeof Link>["href"];
  children: ReactNode;
  className?: string;
};

// 画面上部に置く「◯◯にもどる」リンク。
// router.push ではなく Link で遷移することで、
// 新規タブで開く・戻る操作といったブラウザ標準の挙動を保つ。
export function BackLink({
  href,
  children,
  className,
}: Readonly<BackLinkProps>) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-1 text-sm text-slate-500 transition hover:text-(--brand-green-text)",
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
