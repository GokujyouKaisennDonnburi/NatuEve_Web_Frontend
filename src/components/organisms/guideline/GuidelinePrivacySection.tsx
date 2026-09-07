import { Lock } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { NoteList } from "@/components/atoms/guideline/NoteList";
import { SubsectionHeading } from "@/components/atoms/guideline/SubsectionHeading";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { BlockNote } from "@/components/molecules/guideline/BlockNote";
import { MemberListExample } from "@/components/organisms/guideline/fieldExamples/MemberListExample";

const PERSONAL_INFO_EXAMPLES = [
  "氏名",
  "住所",
  "メールアドレス",
  "電話番号",
  "SNSアカウント",
  "学校名",
  "勤務先",
  "顔写真",
  "車両ナンバー",
  "学生証・身分証明書等",
  "その他、個人を特定できる情報",
];

const paragraph = "text-base leading-[1.8] text-[#333]";

// 8. 個人情報について
export function GuidelinePrivacySection() {
  return (
    <AboutCard>
      <SectionBadge icon={Lock}>8</SectionBadge>
      <SectionTitle>個人情報について</SectionTitle>

      <div className="space-y-10">
        <section>
          <SubsectionHeading number="8.1">
            他人の個人情報を投稿しない
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              他人の個人情報を、本人の同意なく投稿・公開しないでください。
            </p>
            <p className={paragraph}>
              個人情報には、例えば以下のようなものがあります。
            </p>
          </div>
          <NoteList items={PERSONAL_INFO_EXAMPLES} />
        </section>

        <section>
          <SubsectionHeading number="8.2">
            自分の個人情報にも注意する
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              自分自身の情報であっても、一度公開した情報は第三者に保存・転載される可能性があります。
            </p>
            <p className={paragraph}>
              投稿する前に、公開して問題のない情報であるか確認してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="8.3">
            イベント情報・レポートについて
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              イベント情報やレポートは、本サービス上で他の利用者が閲覧できる情報として公開されます。
            </p>
            <p className={paragraph}>
              そのため、イベント情報やレポートに個人情報を記載する場合は、公開範囲を十分に確認してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="8.4">
            参加申込情報について
          </SubsectionHeading>
          <MemberListExample />
          <BlockNote title="参加申込情報">
            <p>
              イベントの主催者は、イベント運営や参加者管理に必要な範囲で参加申込情報を確認できます。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              参加申込時に入力された氏名、メールアドレス、参加人数等の情報は、本サービスの仕様に従い、当該イベントの主催者がイベント運営および参加者管理に必要な範囲で閲覧できます。
            </p>
            <p className={paragraph}>
              参加申込情報は、イベント運営に必要な範囲を超えて利用しないでください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="8.5">
            主催者による参加者情報の取扱い
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              主催者は、参加申込によって知り得た参加者の個人情報を、当該イベントの運営、連絡、参加者管理その他これらに付随する目的の範囲内で適切に取り扱ってください。
            </p>
            <p className={paragraph}>
              参加者の個人情報を、営業・勧誘・宣伝・他のイベントへの案内など、当該イベントの運営と関係のない目的で利用しないでください。
            </p>
            <p className={paragraph}>
              また、参加者の個人情報を第三者へ提供・共有する場合は、法令その他の適用されるルールに従って適切に取り扱ってください。
            </p>
          </div>
        </section>
      </div>
    </AboutCard>
  );
}
