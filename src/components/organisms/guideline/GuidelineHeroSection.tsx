import { FileText } from "lucide-react";

import { AboutCard } from "@/components/molecules/about/AboutCard";

// ガイドライン画面のヒーローセクション
export function GuidelineHeroSection() {
  return (
    <AboutCard className="bg-gradient-to-b from-white to-[#F9FBF5] px-5 py-10 text-center md:px-10 md:py-[60px]">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4E3B3] bg-[#EEF5DF] px-4 py-1.5 text-[13px] font-bold tracking-[0.02em] text-[#5C781E]">
        <FileText className="size-3.5" />
        主催者の方へ
      </div>
      <h1 className="mb-4 text-[28px] font-black tracking-[0.02em] text-[#2D401A] md:text-[38px]">
        投稿ガイドライン
      </h1>
      <p className="mx-auto max-w-[720px] text-[15px] leading-[1.9] text-[#4A6322]">
        本ガイドラインは、なちゅいべ（以下「本サービス」といいます）に投稿されるコンテンツ（イベント情報・活動報告・プロフィール・画像・PDFなど）について、利用者の皆さんに安心してご利用いただくための注意事項をまとめたものです。
        <br />
        本サービスのご利用にあたっては、利用規約とあわせてお読みください。
      </p>
    </AboutCard>
  );
}
