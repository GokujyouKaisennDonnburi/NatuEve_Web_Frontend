import { UserRound } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { SubsectionHeading } from "@/components/atoms/guideline/SubsectionHeading";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { ProfileHeaderExample } from "@/components/organisms/guideline/fieldExamples/ProfileHeaderExample";

const paragraph = "text-base leading-[1.8] text-[#333]";

// 5. プロフィールガイドライン
export function GuidelineProfileSection() {
  return (
    <AboutCard>
      <SectionBadge icon={UserRound}>5</SectionBadge>
      <SectionTitle>プロフィールガイドライン</SectionTitle>
      <p className="mb-2 text-base leading-[1.8] text-[#333]">
        プロフィールは、他の利用者があなたを知るための情報です。
        <br />
        以下の点に注意してください。
      </p>
      <ProfileHeaderExample />

      <div className="space-y-10">
        <section>
          <SubsectionHeading number="5.1">表示名</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              本人を識別しやすく、他の利用者に誤解を与えない適切な表示名を設定してください。
            </p>
            <p className={paragraph}>
              他人になりすますような名前や、他の利用者を誤解させる名前は使用しないでください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="5.2">プロフィール画像</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              プロフィール画像には、本人が使用する権利を持っている画像を使用してください。
            </p>
            <p className={paragraph}>
              他人の写真や、インターネット上から無断転載した画像、第三者の著作権・肖像権等を侵害する画像は使用しないでください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="5.3">自己紹介</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              自己紹介には、本人に関する適切な情報を記載してください。
            </p>
            <p className={paragraph}>
              他人を誹謗中傷する内容、差別的な内容、虚偽の情報、不適切な宣伝・勧誘等は記載しないでください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="5.4">連絡先の掲載</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              メールアドレス、電話番号、SNSアカウントなどの連絡先をプロフィールに記載する場合は、公開範囲を十分に確認してください。
            </p>
            <p className={paragraph}>
              プロフィール情報は、本サービスの仕様上、他の利用者から閲覧できる場合があります。
            </p>
            <p className={paragraph}>
              公開した情報によって発生したトラブルを防ぐため、必要以上の個人情報を掲載しないことをおすすめします。
            </p>
          </div>
        </section>
      </div>
    </AboutCard>
  );
}
