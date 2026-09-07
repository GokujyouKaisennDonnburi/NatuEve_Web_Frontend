import { CalendarDays } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { NoteList } from "@/components/atoms/guideline/NoteList";
import { SubsectionHeading } from "@/components/atoms/guideline/SubsectionHeading";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { BlockNote } from "@/components/molecules/guideline/BlockNote";
import { ApplicationUrlFieldExample } from "@/components/organisms/guideline/fieldExamples/ApplicationUrlFieldExample";
import { EventOverviewFieldExample } from "@/components/organisms/guideline/fieldExamples/EventOverviewFieldExample";
import { EventTitleFieldExample } from "@/components/organisms/guideline/fieldExamples/EventTitleFieldExample";
import { FileUploadExample } from "@/components/organisms/guideline/fieldExamples/FileUploadExample";
import { ItemsFieldExample } from "@/components/organisms/guideline/fieldExamples/ItemsFieldExample";
import { PriceFieldExample } from "@/components/organisms/guideline/fieldExamples/PriceFieldExample";
import { ReceptionFieldExample } from "@/components/organisms/guideline/fieldExamples/ReceptionFieldExample";
import { ScheduleFieldExample } from "@/components/organisms/guideline/fieldExamples/ScheduleFieldExample";
import { TagInputVideoExample } from "@/components/organisms/guideline/fieldExamples/TagInputVideoExample";

const PROHIBITED_URL_ITEMS = [
  "不正なサイト",
  "マルウェア等を含むサイト",
  "詐欺を目的とするサイト",
  "不適切なコンテンツを掲載しているサイト",
  "イベント内容と関係のないサイト",
];

const CHANGE_NOTICE_ITEMS = [
  "開催日時の変更",
  "開催場所の変更",
  "イベント内容の大幅な変更",
  "参加費の変更",
  "開催中止",
];

const paragraph = "text-base leading-[1.8] text-[#333]";

// 3. イベント投稿ガイドライン
export function GuidelineEventPostSection() {
  return (
    <AboutCard>
      <SectionBadge icon={CalendarDays}>3</SectionBadge>
      <SectionTitle>イベント投稿ガイドライン</SectionTitle>

      <div className="space-y-10">
        <section>
          <SubsectionHeading number="3.1">
            イベントタイトルの設定
          </SubsectionHeading>
          <EventTitleFieldExample idPrefix="guideline-3-1" />
          <p className={paragraph}>
            イベントの内容が一目で分かるよう、具体的なタイトルを入力してください。
          </p>
        </section>

        <section>
          <SubsectionHeading number="3.2">イベントタグの設定</SubsectionHeading>
          <TagInputVideoExample />
          <p className={paragraph}>
            イベントの内容と関係のあるタグを設定してください。
          </p>
        </section>

        <section>
          <SubsectionHeading number="3.3">
            開催場所を正確に入力する
          </SubsectionHeading>
          <ScheduleFieldExample variant="venue" idPrefix="guideline-3-3" />
          <div className="space-y-2">
            <p className={paragraph}>
              開催場所を入力する場合は、参加者が実際に訪れる場所を正確に記載してください。
            </p>
            <p className={paragraph}>
              特に、施設名や会場名だけでは場所が分かりにくい場合は、必要に応じて住所や補足情報を記載してください。
            </p>
            <p className={paragraph}>
              また、オンラインイベントの場合は、参加方法や使用するサービスなど、参加者が必要とする情報を分かりやすく記載してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.4">
            開催日時を正確にする
          </SubsectionHeading>
          <ScheduleFieldExample variant="datetime" idPrefix="guideline-3-4" />
          <BlockNote title="開催情報">
            <p>イベントを実際に開催する場所と日時を正確に入力してください。</p>
            <p>
              開催場所が未確定の場合は、参加者が誤解しないよう、確定後に正しい情報へ更新してください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              開催日時、終了日時は正確に入力してください。
            </p>
            <p className={paragraph}>
              特に日時や場所の誤りは、参加者がイベントに参加できなくなるなど、大きな混乱につながる可能性があります。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.5">参加費を明確にする</SubsectionHeading>
          <PriceFieldExample />
          <BlockNote title="参加費用">
            <p>参加者が実際に支払う金額を正確に入力してください。</p>
            <p>
              参加者の区分によって料金が異なる場合は、区分ごとの金額を分かりやすく設定してください。
            </p>
            <p>
              追加料金が発生する場合は、イベント概要等にもその内容を記載してください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              参加費が発生する場合は、金額や内訳を正確に記載してください。
            </p>
            <p className={paragraph}>
              追加料金や条件によって料金が変わる場合は、参加者が誤解しないよう分かりやすく説明してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.6">
            定員を正確に設定する
          </SubsectionHeading>
          <ReceptionFieldExample variant="capacity" idPrefix="guideline-3-6" />
          <BlockNote title="受付設定">
            <p>イベントの参加受付に必要な情報を設定してください。</p>
            <p>
              定員を設定する場合は、実際に受け入れられる人数と一致させてください。
            </p>
          </BlockNote>
          <p className={paragraph}>
            定員に達した場合には、参加申込を受け付けられないことがあります。
          </p>
        </section>

        <section>
          <SubsectionHeading number="3.7">
            申込期限を正確に設定する
          </SubsectionHeading>
          <ReceptionFieldExample variant="deadline" idPrefix="guideline-3-7" />
          <BlockNote title="受付設定">
            <p>イベントの参加受付に必要な情報を設定してください。</p>
            <p>
              申し込み締切を設定する場合は、実際の受付終了日時と一致させてください。
            </p>
          </BlockNote>
          <p className={paragraph}>
            申込期限を過ぎた場合には、参加申込を受け付けられないことがあります。
          </p>
        </section>

        <section>
          <SubsectionHeading number="3.8">関連URLを確認する</SubsectionHeading>
          <ApplicationUrlFieldExample idPrefix="guideline-3-8" />
          <BlockNote title="申し込みURL">
            <p>
              外部サイトで参加申込を受け付ける場合は、正しいURLを設定してください。
            </p>
            <p>
              設定する前に、実際にリンク先へアクセスし、安全で適切なページであることを確認してください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              イベントに関連する外部URLを掲載する場合は、リンク先の内容を事前に確認してください。
            </p>
            <p className={paragraph}>以下のようなURLは掲載しないでください。</p>
          </div>
          <NoteList items={PROHIBITED_URL_ITEMS} />
        </section>

        <section>
          <SubsectionHeading number="3.9">
            持ち物を分かりやすく設定する
          </SubsectionHeading>
          <ItemsFieldExample />
          <BlockNote title="持ち物">
            <p>イベント参加時に必要な持ち物を登録してください。</p>
            <p>
              必ず必要なものは「必須」として設定し、参加者が事前に準備できるようにしてください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              参加者に持参してもらうものがある場合は、具体的に記載してください。
            </p>
            <p className={paragraph}>
              特に、必ず持参する必要があるものについては、参加者が分かるように設定してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.10">
            イベント画像を適切に使用する
          </SubsectionHeading>
          <FileUploadExample variant="image" idPrefix="guideline-3-10" />
          <BlockNote title="イベント画像">
            <p>
              イベントの内容を分かりやすく伝えるための画像をアップロードできます。
            </p>
            <p>
              他人が撮影・作成した画像を利用する場合は、著作権や肖像権等に十分注意してください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              イベント画像を登録する場合は、イベントの内容を分かりやすく伝えられる画像を使用してください。
            </p>
            <p className={paragraph}>
              他人が撮影・作成した画像を使用する場合は、必要な利用許諾を得ていることを確認してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.11">
            イベント資料を適切に使用する
          </SubsectionHeading>
          <FileUploadExample variant="pdf" idPrefix="guideline-3-11" />
          <BlockNote title="イベント資料">
            <p>
              イベントに必要な資料や参加者へ提供するPDF等をアップロードできます。
            </p>
            <p>
              アップロードする前に、誤ったファイルではないこと、不要な個人情報が含まれていないことを確認してください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              特に、個人情報や第三者の権利を侵害する情報が含まれていないか確認してください。
            </p>
            <p className={paragraph}>
              イベントに関する資料を参加者へ提供する場合は、PDF等のファイルをアップロードできます。
            </p>
            <p className={paragraph}>
              アップロードする前に、ファイルの内容を確認してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.12">
            イベント概要を分かりやすく記載する
          </SubsectionHeading>
          <EventOverviewFieldExample idPrefix="guideline-3-12" />
          <BlockNote title="イベント概要">
            <p>
              イベントの目的や内容、対象者、注意事項など、参加者に伝えたい情報を具体的に記載してください。
            </p>
          </BlockNote>
          <div className="space-y-2">
            <p className={paragraph}>
              イベント概要には、参加者がイベントの内容を理解するために必要な情報を分かりやすく記載してください。
            </p>
            <p className={paragraph}>
              「どのようなイベントなのか」「誰を対象としているのか」「何をするのか」などが伝わる文章を心がけてください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.13">
            システム上の制限を守る
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              文字数、タグ数、添付ファイル数、ファイルサイズなどについては、本サービス上に表示される制限に従ってください。
            </p>
            <p className={paragraph}>
              制限を超える内容を無理に登録したり、本サービスの仕様を回避する目的で不正な方法を使用したりしないでください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="3.14">
            開催中止・変更時の対応
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              イベントを中止、延期または変更する場合は、参加者に必要な情報を可能な限り速やかに通知してください。
            </p>
            <p className={paragraph}>
              特に以下のような変更がある場合は、参加者への連絡を行ってください。
            </p>
          </div>
          <NoteList items={CHANGE_NOTICE_ITEMS} />
          <p className={`mt-4 ${paragraph}`}>
            変更内容によって参加者に影響がある場合は、できるだけ早く正確な情報を伝えるようにしてください。
          </p>
        </section>

        <section>
          <SubsectionHeading number="3.15">
            誤解を招く表現を避ける
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              参加者に誤解を与えるような表現は避けてください。
            </p>
            <p className={paragraph}>
              イベントの魅力を伝える場合も、事実に基づいた分かりやすい表現を使用してください。
            </p>
          </div>
        </section>
      </div>
    </AboutCard>
  );
}
