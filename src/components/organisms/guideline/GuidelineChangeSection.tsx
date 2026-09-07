import { RefreshCw } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

const paragraph = "text-base leading-[1.8] text-[#333]";

// 12. ガイドラインの変更
export function GuidelineChangeSection() {
  return (
    <AboutCard>
      <SectionBadge icon={RefreshCw}>12</SectionBadge>
      <SectionTitle>ガイドラインの変更</SectionTitle>
      <div className="space-y-4">
        <p className={paragraph}>
          運営は、法令の変更、本サービスの仕様変更、サービス運営上の必要その他の事情により、予告なしに本ガイドラインを改訂することがあります。
        </p>
        <p className={paragraph}>
          変更した場合は、本サービス上で改訂後の内容を公表します。
        </p>
        <p className={paragraph}>
          重要な改訂を行う場合には、可能な限り事前に利用者へお知らせします。
        </p>
      </div>
    </AboutCard>
  );
}
