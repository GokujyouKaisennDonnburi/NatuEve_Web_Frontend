import { BookOpen } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { HighlightBanner } from "@/components/molecules/about/HighlightBanner";

const PARAGRAPHS = [
  "本ガイドラインは、なちゅいべ（以下「本サービス」といいます）に投稿されるコンテンツ（イベント情報・レポート・プロフィール）について、利用者の皆さんに安心してご利用いただくための注意事項をまとめたものです。",
  "なちゅいべは、人と人が安心してつながり、イベントや活動を共有するためのサービスです。",
];

// 1. はじめに
export function GuidelineIntroductionSection() {
  return (
    <AboutCard>
      <SectionBadge icon={BookOpen}>1</SectionBadge>
      <SectionTitle>はじめに</SectionTitle>
      <div className="space-y-4">
        {PARAGRAPHS.map((paragraph) => (
          <p key={paragraph} className="text-base leading-[1.8] text-[#333]">
            {paragraph}
          </p>
        ))}
        <p className="text-base leading-[1.8] text-[#333]">
          本ガイドラインは、利用規約を補足するものであり、本サービスを安心・安全に利用するための指針を示しています。
        </p>
      </div>
      <div className="mt-6">
        <HighlightBanner>
          本ガイドラインに反する投稿は、利用規約に基づき、削除・非公開・表示制限・利用停止等の対象となる場合があります。
        </HighlightBanner>
      </div>
    </AboutCard>
  );
}
