import { Heart, Lightbulb, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

type Principle = {
  icon: LucideIcon;
  title: string;
  description: string[];
};

const PRINCIPLES: Principle[] = [
  {
    icon: Heart,
    title: "安心",
    description: [
      "他の利用者を不快にさせたり、傷つけたりする内容を投稿しないでください。",
      "相手の立場や状況を考え、誰が読んでも安心できる投稿を心がけてください。",
    ],
  },
  {
    icon: ShieldCheck,
    title: "正確",
    description: [
      "事実と異なる情報や、誤解を招く情報を投稿しないでください。",
      "特にイベント情報については、開催日時、場所、参加費、定員、申込期限などを正確に記載してください。",
      "情報に不確かな部分がある場合は、その旨を明示してください。",
    ],
  },
  {
    icon: Lightbulb,
    title: "分かりやすい",
    description: [
      "読む人がイベントや活動の内容を理解できるよう、必要な情報を分かりやすく記載してください。",
      "「誰の目に触れるか」「誰の情報が含まれているか」を考えて投稿しましょう。",
    ],
  },
];

// 2. 基本的な考え方
export function GuidelinePrinciplesSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Lightbulb}>2</SectionBadge>
      <SectionTitle>基本的な考え方</SectionTitle>
      <p className="mb-6 text-base leading-[1.8] text-[#333]">
        投稿にあたっては、以下の3つの観点を意識してください。
      </p>
      <div className="space-y-6">
        {PRINCIPLES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-[14px] border border-[#DCE8C8] bg-[#FAFBF7] p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-[#2D401A]">
              <Icon className="size-5 text-[#85A928]" />
              {title}
            </h3>
            <div className="space-y-2">
              {description.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base leading-[1.8] text-[#333]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-base font-bold text-[#3B5220]">
        上記の内容を、投稿する前に一度確認してください。
      </p>
    </AboutCard>
  );
}
