import { Building2, Mail } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

export function AboutOperatingInfoSection() {
  return (
    <AboutCard className="text-center">
      <SectionBadge icon={Building2}>運営情報</SectionBadge>
      <SectionTitle center>運営について</SectionTitle>
      <p className="mt-2 text-[17px] font-bold text-[#2D401A]">
        なちゅいべは、NatuPortal が運営しています。
      </p>
      <div className="my-5 inline-flex flex-col items-center gap-1.5 rounded-2xl border border-[#D4E3B3] bg-[#F4F8EC] px-5 py-4 text-base text-[#2D401A] sm:flex-row sm:gap-3 sm:rounded-[50px] sm:px-8">
        <span className="flex items-center gap-2 font-bold text-[#4A5542]">
          <Mail className="size-4 text-[#85A928]" />
          お問い合わせ
        </span>
        <a
          href="mailto:natuive-info@natuportal.org"
          className="font-bold text-[#618218] hover:underline"
        >
          natuive-info@natuportal.org
        </a>
      </div>
    </AboutCard>
  );
}
