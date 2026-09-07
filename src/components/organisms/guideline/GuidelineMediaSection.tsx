import { Paperclip } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { NoteList } from "@/components/atoms/guideline/NoteList";
import { SubsectionHeading } from "@/components/atoms/guideline/SubsectionHeading";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { HighlightBanner } from "@/components/molecules/about/HighlightBanner";
import {
  PersonalInfoCheckGraphic,
  PhotoConsentGraphic,
} from "@/components/organisms/guideline/fieldExamples/AttentionGraphic";

const PERSONAL_INFO_ITEMS = [
  "氏名",
  "住所",
  "電話番号",
  "メールアドレス",
  "学校名",
  "勤務先",
  "学生証",
  "身分証明書",
  "会員証",
  "SNSアカウント",
  "車両ナンバー",
  "その他個人を特定できる情報",
];

const AI_ATTENTION_ITEMS = [
  "他人の著作物を無断で利用しない",
  "他人の肖像を無断で利用しない",
  "実在する人物になりすます目的で利用しない",
  "虚偽の情報を事実であるかのように投稿しない",
  "第三者の権利を侵害するコンテンツを投稿しない",
];

const paragraph = "text-base leading-[1.8] text-[#333]";

// 6. 画像・PDF・URL・AI生成コンテンツについて
export function GuidelineMediaSection() {
  return (
    <AboutCard>
      <SectionBadge icon={Paperclip}>6</SectionBadge>
      <SectionTitle>画像・PDF・URL・AI生成コンテンツについて</SectionTitle>

      <div className="space-y-10">
        <section>
          <SubsectionHeading number="6.1">対応形式・サイズ</SubsectionHeading>
          <p className={paragraph}>
            画像、PDFその他のファイルについては、本サービス上に表示される対応形式・サイズ等の制限に従ってください。
          </p>
        </section>

        <section>
          <SubsectionHeading number="6.2">
            他人が撮影・作成したコンテンツ
          </SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              他人が撮影・作成した画像、文章、PDF、イラスト、音楽その他のコンテンツを、権利者の許可なく転載・アップロードしないでください。
            </p>
            <p className={paragraph}>
              インターネット上で公開されている画像であっても、自由に利用できるとは限りません。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="6.3">顔写真・肖像</SubsectionHeading>
          <PhotoConsentGraphic />
          <div className="space-y-2">
            <p className={paragraph}>
              他の人が写っている写真を投稿する場合は、本人の了承を得るなど、肖像権やプライバシーに配慮してください。
            </p>
            <p className={paragraph}>
              特に、未成年者が写っている写真を投稿する場合は、より慎重に取り扱ってください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="6.4">
            個人を特定できる情報
          </SubsectionHeading>
          <p className={paragraph}>
            画像やPDFの中に、以下のような情報が含まれていないか確認してください。
          </p>
          <NoteList items={PERSONAL_INFO_ITEMS} />
          <p className={`mt-4 ${paragraph}`}>
            必要のない個人情報は、削除または隠してからアップロードしてください。
          </p>
          <PersonalInfoCheckGraphic />
        </section>

        <section>
          <SubsectionHeading number="6.5">URL</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              掲載する外部URLは、リンク先の内容が適切であることを事前に確認してください。
            </p>
            <p className={paragraph}>
              リンク先が変更されていないかについても、可能な範囲で確認してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="6.6">
            ファイルの内容を確認する
          </SubsectionHeading>
          <div className="my-5">
            <HighlightBanner>
              アップロード前にファイルの中身を確認しましょう。
            </HighlightBanner>
          </div>
          <div className="space-y-2">
            <p className={paragraph}>
              ファイルをアップロードする前に、意図したファイルであることを確認してください。
            </p>
            <p className={paragraph}>
              特に、誤ったファイルや個人情報を含むファイルを誤って公開しないよう注意してください。
            </p>
          </div>
        </section>

        <section>
          <SubsectionHeading number="6.7">AI生成コンテンツ</SubsectionHeading>
          <div className="space-y-2">
            <p className={paragraph}>
              AIを利用して作成した文章、画像その他のコンテンツを投稿する場合も、通常の投稿と同様に本ガイドラインおよび利用規約を守ってください。
            </p>
            <p className={paragraph}>特に以下の点に注意してください。</p>
          </div>
          <NoteList items={AI_ATTENTION_ITEMS} />
          <p className={`mt-4 ${paragraph}`}>
            AIを利用した場合であっても、投稿した利用者がその内容について責任を負うものとします。
          </p>
        </section>
      </div>
    </AboutCard>
  );
}
