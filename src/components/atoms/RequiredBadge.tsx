// 「必須」または「任意」のバッジ
type RequiredBadgeProps = {
  isRequired: boolean;
  // サイズ（省略時は md）。フォーム等では md、モーダル内のコンパクトな表示には sm を使う。
  size?: "sm" | "md";
};

// 「必須」または「任意」のバッジ
export function RequiredBadge({
  isRequired,
  size = "md",
}: Readonly<RequiredBadgeProps>) {
  const sizeClass =
    size === "sm"
      ? "min-w-8 px-1.5 py-px text-[9px] font-bold"
      : "min-w-11 px-2 py-0.5 text-xs font-semibold";

  return (
    <span
      className={`inline-flex justify-center rounded-full text-slate-800 ${sizeClass} ${
        isRequired ? "bg-(--brand-orange)" : "bg-(--brand-green)" // ブランドカラーを使用(globals.cssで定義)
      }`}
    >
      {isRequired ? "必須" : "任意"}
    </span>
  );
}
