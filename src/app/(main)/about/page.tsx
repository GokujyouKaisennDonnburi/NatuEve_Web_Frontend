import { AboutActivityReportSection } from "@/components/organisms/about/AboutActivityReportSection";
import { AboutBackgroundSection } from "@/components/organisms/about/AboutBackgroundSection";
import { AboutEcosystemProtectionSection } from "@/components/organisms/about/AboutEcosystemProtectionSection";
import { AboutFeaturesSection } from "@/components/organisms/about/AboutFeaturesSection";
import { AboutHeroSection } from "@/components/organisms/about/AboutHeroSection";
import { AboutOperatingInfoSection } from "@/components/organisms/about/AboutOperatingInfoSection";

export default function AboutPage() {
  return (
    <div className="mx-auto mt-6 w-full max-w-[920px] space-y-8">
      <AboutHeroSection />
      <AboutBackgroundSection />
      <AboutFeaturesSection />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AboutActivityReportSection />
        <AboutEcosystemProtectionSection />
      </div>
      <AboutOperatingInfoSection />
    </div>
  );
}
