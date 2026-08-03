// 「必須」または「任意」のバッジ
type RequiredBadgeProps = {
  isRequired: boolean;
};

// 「必須」または「任意」のバッジ
export function RequiredBadge({ isRequired }: Readonly<RequiredBadgeProps>) {
  return (
    <span
      className={`inline-flex min-w-11 justify-center rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800 ${
        isRequired ? "bg-(--brand-orange)" : "bg-(--brand-green)" // bg-[#F8C568]とbg-[#9ACA4A]に変更した方がFigmaのデザインに近いが、今回はTailwindの色を使う方針で統一する
      }`}
    >
      {isRequired ? "必須" : "任意"}
    </span>
  );
}
