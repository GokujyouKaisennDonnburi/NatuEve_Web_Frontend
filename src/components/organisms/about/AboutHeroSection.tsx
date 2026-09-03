import { Flag } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { AboutCard } from "@/components/molecules/about/AboutCard";

export function AboutHeroSection() {
  return (
    <AboutCard className="bg-gradient-to-b from-white to-[#F9FBF5] px-5 py-10 text-center md:px-10 md:py-[60px]">
      <SectionBadge icon={Flag}>コンセプト</SectionBadge>
      <h1 className="mb-3 text-[28px] font-black tracking-[0.02em] text-[#2D401A] md:text-[38px]">
        なちゅいべとは
      </h1>
      <div className="inline-block rounded-[30px] bg-[#EEF5DF] px-5 py-1.5 text-lg font-bold text-[#618218] md:px-7 md:py-2 md:text-[22px]">
        生態系を守り、未来へ繋ぐ
      </div>
    </AboutCard>
  );
}
