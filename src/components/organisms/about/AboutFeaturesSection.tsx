import type { LucideIcon } from "lucide-react";
import {
  ClipboardCheck,
  Compass,
  Filter,
  Megaphone,
  Search,
} from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { FeatureCard } from "@/components/molecules/about/FeatureCard";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Search,
    title: "探せる",
    description: "全国のイベントを、ひとつの一覧から",
  },
  {
    icon: Filter,
    title: "選べる",
    description: "日付や場所、はじめての人向けかどうかで絞り込める",
  },
  {
    icon: ClipboardCheck,
    title: "分かる",
    description: "持ち物も費用も当日の流れも、申し込む前に",
  },
  {
    icon: Megaphone,
    title: "届く",
    description: "個人でも団体でも、関心のある人にまっすぐ",
  },
];

export function AboutFeaturesSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Compass}>サービスの特徴</SectionBadge>
      <SectionTitle>散らばったイベントを、ひとつに。</SectionTitle>
      <p className="mb-6 text-base text-[#55634C]">
        なちゅいべは、生き物に関わるイベントを一箇所に集めるサイトです。
      </p>
      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
      <div className="rounded-[14px] bg-[#EEF5DF] p-5 text-center text-[17px] font-bold text-[#2D401A]">
        つながりがなくても、関心さえあれば見つけられる。見つけてから参加するまでを、まっすぐにします。
      </div>
    </AboutCard>
  );
}
