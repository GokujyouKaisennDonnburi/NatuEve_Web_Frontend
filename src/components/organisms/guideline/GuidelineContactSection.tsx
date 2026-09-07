import { Mail } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

// 13. お問い合わせ
// 【記入】【YYYY年MM月DD日】は運営側で後日埋める前提のプレースホルダー。
export function GuidelineContactSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Mail}>13</SectionBadge>
      <SectionTitle>お問い合わせ</SectionTitle>
      <p className="text-base leading-[1.8] text-[#333]">
        本ガイドラインに関するお問い合わせは、本サービスのお問い合わせ窓口までご連絡ください。
      </p>
      <div className="mt-5 rounded-[14px] border border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-5 text-base leading-[1.8] text-[#333]">
        <p>メールアドレス：natueve-info@natuportal.org </p>
        {/* <p>その他のお問い合わせ方法：【必要に応じて記入】</p> */}
        <div className="mt-4 border-t border-[#E2EBD3] pt-4">
          <p>制定日：2026年9月7日</p>
          <p>最終改定日：2026年9月7日</p>
        </div>
      </div>
    </AboutCard>
  );
}
