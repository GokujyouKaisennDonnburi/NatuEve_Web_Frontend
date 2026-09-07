import { Flag } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { NoteList } from "@/components/atoms/guideline/NoteList";
import { AboutCard } from "@/components/molecules/about/AboutCard";

const REPORT_INFO_ITEMS = [
  "問題のあるイベントや投稿のURL",
  "問題と思われる内容",
  "問題があると考えられる理由",
  "その他、確認に必要と思われる情報",
];

const paragraph = "text-base leading-[1.8] text-[#333]";

// 11. 違反投稿を見つけた場合
export function GuidelineReportingSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Flag}>11</SectionBadge>
      <SectionTitle>違反投稿を見つけた場合</SectionTitle>
      <p className={paragraph}>
        本サービス上で、利用規約や本ガイドラインに違反していると思われる投稿を見つけた場合は、運営のお問い合わせ窓口までご連絡ください。
      </p>
      <p className={`mt-4 ${paragraph}`}>
        お問い合わせの際は、可能な範囲で以下の情報をお知らせください。
      </p>
      <NoteList items={REPORT_INFO_ITEMS} />
      <p className={`mt-6 ${paragraph}`}>
        運営は、いただいた情報を確認したうえで、必要に応じて適切な対応を行います。
      </p>
    </AboutCard>
  );
}
