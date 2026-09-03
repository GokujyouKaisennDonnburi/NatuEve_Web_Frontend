import type { LucideIcon } from "lucide-react";
import {
  Bug,
  CircleAlert,
  Fish,
  Lightbulb,
  Sprout,
  TreePine,
  Waves,
} from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { HighlightBanner } from "@/components/molecules/about/HighlightBanner";

const EVENT_EXAMPLES: { icon: LucideIcon; label: string }[] = [
  { icon: Fish, label: "川の生きもの観察会" },
  { icon: Waves, label: "干潟の調査" },
  { icon: Bug, label: "外来種の防除作業" },
  { icon: TreePine, label: "里山の草刈り" },
];

const ISSUES = [
  "参加したい人は、イベントを見つけられない。",
  "主催者は、参加者を集められない。",
  "そして保全の現場では、人手が足りないままです。",
];

export function AboutBackgroundSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Sprout}>背景</SectionBadge>
      <SectionTitle>見つけられないイベントが、たくさんある</SectionTitle>
      <p className="text-base leading-[1.8] text-[#333]">
        生き物のイベントは、日本各地で毎週のように開かれています。
      </p>
      <div className="my-4 flex flex-wrap gap-2.5">
        {EVENT_EXAMPLES.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 rounded-lg border border-[#DCE8C8] bg-[#F2F7E9] px-4 py-1.5 text-sm font-medium text-[#4A6322]"
          >
            <Icon className="size-3.5" />
            {label}
          </span>
        ))}
      </div>
      <p className="text-base leading-[1.8] text-[#333]">
        けれど、その情報はSNSや団体のホームページ、公民館のチラシに散らばっています。
        <br />
        探そうと思っても、どこを見ればいいのか分からない。結局、団体に所属している人や、たまたま知り合いがいた人にしか届いていません。
      </p>
      <div className="my-5 rounded-[14px] border border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
        <ul className="flex flex-col gap-3">
          {ISSUES.map((text) => (
            <li
              key={text}
              className="flex items-start gap-3 text-base font-bold text-[#3B5220]"
            >
              <CircleAlert className="mt-[3px] size-[18px] shrink-0 text-[#D97706]" />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <HighlightBanner>
        <Lightbulb className="size-4 shrink-0" />
        関心がないから参加しないのではありません。入口が見つからないだけです。
      </HighlightBanner>
    </AboutCard>
  );
}
