import { CheckCircle } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { HighlightBanner } from "@/components/molecules/about/HighlightBanner";

const CHECK_ITEMS = [
  "この内容を公開しても問題ないか",
  "他の利用者が安心して読める内容か",
  "第三者の権利やプライバシーを侵害していないか",
  "内容に誤りや誤解を招く表現がないか",
];

// 1. はじめに
export function GuidelineIntroductionSection() {
  return (
    <AboutCard>
      <SectionBadge icon={CheckCircle}>はじめに</SectionBadge>
      <SectionTitle>投稿前に確認してください</SectionTitle>
      <p className="text-base leading-[1.8] text-[#333]">
        本ガイドラインは、本サービス上でイベント情報、活動報告（レポート）、プロフィール、画像、PDFその他のコンテンツを投稿する際に守っていただきたい事項を定めるものです。
      </p>
      <p className="mt-4 text-base leading-[1.8] text-[#333]">
        なちゅいべは、人と人が安心してつながり、イベントや活動を共有するためのサービスです。投稿する前に、以下の点を一度確認してください。
      </p>
      <ul className="mt-5 space-y-3">
        {CHECK_ITEMS.map((text) => (
          <li
            key={text}
            className="flex items-start gap-3 text-base font-bold text-[#3B5220]"
          >
            <CheckCircle className="mt-[3px] size-[18px] shrink-0 text-[#85A928]" />
            {text}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <HighlightBanner>
          本ガイドラインは、利用規約を補足するものであり、本サービスを安心・安全に利用するための指針を示しています。本ガイドラインに反する投稿は、利用規約に基づき、削除・非公開・表示制限・利用停止等の対象となる場合があります。
        </HighlightBanner>
      </div>
    </AboutCard>
  );
}
