import { NotebookPen } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { NoteList } from "@/components/atoms/guideline/NoteList";
import { SubsectionHeading } from "@/components/atoms/guideline/SubsectionHeading";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { ReportFormExample } from "@/components/organisms/guideline/fieldExamples/ReportFormExample";

const PRIVACY_ATTENTION_ITEMS = [
  "顔写真",
  "氏名",
  "学校名",
  "勤務先",
  "住所",
  "電話番号",
  "メールアドレス",
  "SNSアカウント",
  "その他個人を特定できる情報",
];

const FILE_CHECK_ITEMS = [
  "レポートの内容と関係しているか",
  "閲覧者にとって安全な内容か",
  "第三者の権利を侵害していないか",
  "個人情報が含まれていないか",
  "意図しない情報が含まれていないか",
];

const paragraph = "text-base leading-[1.8] text-[#333]";

// 4. レポートガイドライン
export function GuidelineReportSection() {
  return (
    <AboutCard>
      <SectionBadge icon={NotebookPen}>4</SectionBadge>
      <SectionTitle>レポートガイドライン</SectionTitle>
      <p className="mb-8 text-base leading-[1.8] text-[#333]">
        イベント終了後にレポートを投稿するときは、以下の点に注意してください。
      </p>

      <div className="space-y-10">
        <section>
          <SubsectionHeading number="4.1">
            事実に基づいて報告する
          </SubsectionHeading>
          <ReportFormExample />
          <div className="space-y-2">
            <p className={paragraph}>
              実際に行われた活動内容を、正確に記載してください。
            </p>
            <p className={paragraph}>
              活動していない内容を実施したかのように記載したり、実際とは異なる成果を掲げたりしないでください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="4.2">
            参加者のプライバシーに配慮する
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              レポートに参加者の写真や個人情報を掲載する場合は、本人の了承を得るなど、適切な配慮をしてください。
            </p>
            <p className={paragraph}>特に以下の情報には注意してください。</p>
          </div>
          <NoteList items={PRIVACY_ATTENTION_ITEMS} />
        </section>

        <section>
          <SubsectionHeading number="4.3">
            個人を攻撃する内容を掲載しない
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              特定の参加者や第三者を名指しして、批判、誹謗中傷、嫌がらせ等を行う投稿はしないでください。
            </p>
            <p className={paragraph}>
              活動上の課題や改善点について記載する場合も、個人を特定できる形での攻撃的な表現は避けてください。
            </p>
            <p className={paragraph}>
              また、投稿内容が他者の名誉、プライバシー、肖像、その他の権利を侵害する場合や、悪質な誹謗中傷・嫌がらせ等に該当する場合には、投稿の削除・非公開等の措置に加え、必要に応じて、関係機関への相談・通報、その他の法的措置を講じる場合があります。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="4.4">
            外部URL・添付ファイルを確認する
          </SubsectionHeading>
          <p className={paragraph}>
            関連URLや添付する画像・PDFについて、以下を確認してください。
          </p>
          <NoteList items={FILE_CHECK_ITEMS} />
        </section>

        <section>
          <SubsectionHeading number="4.5">レポートの投稿</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              レポートは、実際に開催されたイベントの活動内容を報告するために利用してください。
            </p>
            <p className={paragraph}>
              1つのイベントについて複数のレポートを作成するなど、本サービスの想定する利用方法と異なる投稿は控えてください。
            </p>
          </div>
        </section>
      </div>
    </AboutCard>
  );
}
