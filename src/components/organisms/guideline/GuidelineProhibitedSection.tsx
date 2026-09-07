import { Ban } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

const PROHIBITED_ITEMS = [
  "法令・公序良俗に反する投稿",
  "犯罪行為や違法行為を助長する投稿",
  "わいせつな内容を含む投稿",
  "児童虐待等に該当する内容を含む投稿",
  "過度に暴力的・残虐な内容を含む投稿",
  "差別的な表現を含む投稿",
  "誹謗中傷や嫌がらせを目的とした投稿",
  "虚偽の情報や、著しく誤解を招く情報を投稿する行為",
  "詐欺や不当な金銭取得を目的とする投稿",
  "第三者の著作権・商標権・肖像権・プライバシーその他の権利を侵害する投稿",
  "第三者になりすました投稿",
  "他人の個人情報を本人の同意なく公開する投稿",
  "マルウェア、ウイルスその他の有害なプログラム等を含むファイルの投稿",
  "本サービスまたは第三者のサービスを妨害する投稿",
  "無断で大量の広告・宣伝・勧誘を行う投稿",
  "スパムを目的とした投稿",
  "本サービスを利用して他の利用者に迷惑をかける行為",
  "その他、利用規約に定める禁止事項に該当する投稿",
  "その他、本サービスの目的や趣旨に照らして不適切であると運営が合理的に判断する投稿",
];

// 7. 禁止される投稿
export function GuidelineProhibitedSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Ban}>7</SectionBadge>
      <SectionTitle>禁止される投稿</SectionTitle>
      <p className="mb-4 text-base leading-[1.8] text-[#333]">
        以下のような投稿は禁止しています。
      </p>
      <ol className="space-y-2.5">
        {PROHIBITED_ITEMS.map((item, index) => (
          <li
            key={item}
            className="flex items-start gap-3 text-base leading-[1.8] text-[#333]"
          >
            <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#DCE8C8] bg-[#FAFBF7] text-xs font-bold text-[#3B5220]">
              {index + 1}
            </span>
            {item}
          </li>
        ))}
      </ol>
    </AboutCard>
  );
}
