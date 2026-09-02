import { Shield, Sprout, Lock } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { AboutCard } from "@/components/molecules/about/AboutCard";

export function AboutEcosystemProtectionSection() {
  return (
    <AboutCard className="flex flex-col md:p-8">
      <SectionBadge icon={Shield}>生態系の保護</SectionBadge>
      <h3 className="mb-3.5 flex items-center gap-2.5 text-xl font-bold text-[#2D401A]">
        <Sprout className="size-5 text-[#85A928]" />
        希少な生き物のいる場所は、公開しません
      </h3>
      <p className="mb-3 text-[15px] text-[#4A5542]">
        イベント情報を広く届けることと、生き物を守ることは、ときにぶつかります。
      </p>
      <p className="mb-3 text-[15px] text-[#4A5542]">
        珍しい植物の自生地や繁殖地の正確な位置が広まれば、盗掘や乱獲を招きます。だからなちゅいべでは、公開する場所の細かさを主催者が選べるようにしています。市区町村までしか出さない、という選び方もできます。
      </p>
      {/* カード内の下端に揃えるため、mt-auto で最後の要素を底部に寄せる */}
      <div className="mt-auto pt-4">
        <p className="flex items-center gap-2 rounded-lg border border-[#D4E3B3] bg-[#F4F8EC] px-3.5 py-2.5 text-[14.5px] font-bold text-[#2D401A]">
          <Lock className="size-4 shrink-0 text-[#85A928]" />
          詳しい集合場所は、参加が決まった方にお伝えします。
        </p>
      </div>
    </AboutCard>
  );
}
