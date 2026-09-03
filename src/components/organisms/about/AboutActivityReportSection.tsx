import { BookOpen, History } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { HighlightBanner } from "@/components/molecules/about/HighlightBanner";

export function AboutActivityReportSection() {
  return (
    <AboutCard className="flex flex-col md:p-8">
      <SectionBadge icon={BookOpen}>活動レポート</SectionBadge>
      <h3 className="mb-3.5 flex items-center gap-2.5 text-xl font-bold text-[#2D401A]">
        <History className="size-5 text-[#85A928]" />
        記録を、次につなげる
      </h3>
      <p className="mb-3 text-[15px] text-[#4A5542]">
        イベントが終わったら、主催者がレポートを残せます。
      </p>
      <p className="mb-3 text-[15px] text-[#4A5542]">
        その日どんな生き物に出会ったのか、何人が集まったのか。ひとつひとつは小さな記録ですが、積み重なれば活動の成果を示すものになります。次に参加する人にとっては、どんな会なのかを知る手がかりにもなります。
      </p>
      {/* カード内の下端に揃えるため、mt-auto で最後の要素を底部に寄せる */}
      <div className="mt-auto pt-4">
        <HighlightBanner>
          <span className="text-[14.5px]">
            やって終わりにしない。それがなちゅいべの目標です。
          </span>
        </HighlightBanner>
      </div>
    </AboutCard>
  );
}
