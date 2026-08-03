import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventPostCancelButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "type" | "variant" | "asChild"
> & {
  // リンクとして扱う場合の遷移先。未指定時は button として描画される
  href?: ComponentPropsWithoutRef<typeof Link>["href"];
  // リンクとして扱う際に <Link> に渡す追加 props（target / rel など）
  linkProps?: Omit<ComponentPropsWithoutRef<typeof Link>, "href">;
};

// イベント投稿フォームのキャンセルボタンコンポーネント
// href を渡すと <Link> でラップしてリンクとして振る舞い、
// 新規タブ表示やナビゲーションのセマンティクスを確保する
export function EventPostCancelButton({
  className,
  children,
  href,
  linkProps,
  ...props
}: Readonly<EventPostCancelButtonProps>) {
  const buttonClassName = cn(
    "rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-normal text-slate-800 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300/40",
    className,
  );

  if (href !== undefined) {
    return (
      <Button
        asChild
        type="button"
        variant="outline"
        className={buttonClassName}
      >
        <Link href={href} {...linkProps}>
          {children}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      {...props}
      type="button"
      variant="outline"
      className={buttonClassName}
    >
      {children}
    </Button>
  );
}
