import { GuidelineChangeSection } from "@/components/organisms/guideline/GuidelineChangeSection";
import { GuidelineChecklistSection } from "@/components/organisms/guideline/GuidelineChecklistSection";
import { GuidelineContactSection } from "@/components/organisms/guideline/GuidelineContactSection";
import { GuidelineEventPostSection } from "@/components/organisms/guideline/GuidelineEventPostSection";
import { GuidelineHeroSection } from "@/components/organisms/guideline/GuidelineHeroSection";
import { GuidelineIntroductionSection } from "@/components/organisms/guideline/GuidelineIntroductionSection";
import { GuidelineMediaSection } from "@/components/organisms/guideline/GuidelineMediaSection";
import { GuidelinePrivacySection } from "@/components/organisms/guideline/GuidelinePrivacySection";
import { GuidelinePrinciplesSection } from "@/components/organisms/guideline/GuidelinePrinciplesSection";
import { GuidelineProhibitedSection } from "@/components/organisms/guideline/GuidelineProhibitedSection";
import { GuidelineProfileSection } from "@/components/organisms/guideline/GuidelineProfileSection";
import { GuidelineReportSection } from "@/components/organisms/guideline/GuidelineReportSection";
import { GuidelineReportingSection } from "@/components/organisms/guideline/GuidelineReportingSection";
import { GuidelineViolationResponseSection } from "@/components/organisms/guideline/GuidelineViolationResponseSection";

export default function GuidelinePage() {
  return (
    <div className="mx-auto mt-6 w-full max-w-[920px] space-y-8">
      <GuidelineHeroSection />
      <GuidelineIntroductionSection />
      <GuidelinePrinciplesSection />
      <GuidelineEventPostSection />
      <GuidelineReportSection />
      <GuidelineProfileSection />
      <GuidelineMediaSection />
      <GuidelineProhibitedSection />
      <GuidelinePrivacySection />
      <GuidelineChecklistSection />
      <GuidelineViolationResponseSection />
      <GuidelineReportingSection />
      <GuidelineChangeSection />
      <GuidelineContactSection />
    </div>
  );
}
