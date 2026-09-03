import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

// 「サービスの特徴」の4カード共通のレイアウト
export function FeatureCard({
  icon: Icon,
  title,
  description,
}: Readonly<FeatureCardProps>) {
  return (
    <div className="flex items-start gap-[18px] rounded-2xl border border-[#E2EBD3] bg-[#FCFDFA] p-6">
      <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#EEF5DF] text-[#72961D]">
        <Icon className="size-[22px]" />
      </span>
      <div>
        <h3 className="mb-1.5 text-lg font-bold text-[#2D401A]">{title}</h3>
        <p className="text-[14.5px] leading-[1.6] text-[#55634C]">
          {description}
        </p>
      </div>
    </div>
  );
}
