import { GuidelineEventPostSection } from "@/components/organisms/guideline/GuidelineEventPostSection";
import { GuidelineHeroSection } from "@/components/organisms/guideline/GuidelineHeroSection";
import { GuidelineIntroductionSection } from "@/components/organisms/guideline/GuidelineIntroductionSection";
import { GuidelinePrinciplesSection } from "@/components/organisms/guideline/GuidelinePrinciplesSection";

export default function GuidelinePage() {
  return (
    <div className="mx-auto mt-6 w-full max-w-[920px] space-y-8">
      <GuidelineHeroSection />
      <GuidelineIntroductionSection />
      <GuidelinePrinciplesSection />
      <GuidelineEventPostSection />
    </div>
  );
}
