import { ClipboardCheck } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

const CHECKLIST_GROUPS = [
  {
    title: "内容について",
    items: [
      "事実と異なる情報が含まれていない",
      "誤解を招く表現が含まれていない",
      "他人を不快にさせたり傷つけたりする表現がない",
      "誹謗中傷や差別的な表現がない",
      "イベントの日時・場所・内容等が正しい",
    ],
  },
  {
    title: "個人情報について",
    items: [
      "他人の個人情報が含まれていない",
      "他人の顔写真を掲載する場合、必要な了承を得ている",
      "学生証・身分証明書等が写り込んでいない",
      "電話番号・メールアドレス等が意図せず公開されていない",
      "自分自身の個人情報を公開して問題ないか確認した",
    ],
  },
  {
    title: "著作権・権利について",
    items: [
      "他人の著作物を無断で使用していない",
      "使用する画像・PDF等について必要な権利を有している",
      "他人の肖像権・プライバシーを侵害していない",
      "AI生成コンテンツを含む場合、第三者の権利を侵害していない",
    ],
  },
  {
    title: "URL・ファイルについて",
    items: [
      "外部URLのリンク先が適切である",
      "アップロードするファイルが意図したものである",
      "不要な個人情報がファイルに含まれていない",
      "ファイル形式・サイズ等がシステムの制限を満たしている",
    ],
  },
] as const;

// 9. 投稿前チェックリスト
export function GuidelineChecklistSection() {
  return (
    <AboutCard>
      <SectionBadge icon={ClipboardCheck}>9</SectionBadge>
      <SectionTitle>投稿前チェックリスト</SectionTitle>
      <p className="mb-6 text-base leading-[1.8] text-[#333]">
        投稿する前に、以下を確認してください。
      </p>
      <div className="space-y-6">
        {CHECKLIST_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-[14px] border border-[#DCE8C8] bg-[#FAFBF7] p-5"
          >
            <h3 className="mb-3 text-lg font-bold text-[#2D401A]">
              {group.title}
            </h3>
            <ul className="space-y-2.5">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base text-[#333]"
                >
                  <span
                    aria-hidden="true"
                    className="mt-[5px] size-[18px] shrink-0 rounded-[5px] border-2 border-[#85A928] bg-white"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </AboutCard>
  );
}
