import { ShieldAlert } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { NoteList } from "@/components/atoms/guideline/NoteList";
import { AboutCard } from "@/components/molecules/about/AboutCard";

const RESPONSE_ITEMS = [
  "投稿の削除",
  "投稿の非公開化",
  "投稿の表示制限",
  "投稿者への注意・連絡",
  "本サービスの一部機能の利用停止",
  "アカウントの利用停止",
  "アカウントの削除",
  "その他、本サービスの運営上必要な措置",
];

const paragraph = "text-base leading-[1.8] text-[#333]";

// 10. ガイドライン違反への対応
export function GuidelineViolationResponseSection() {
  return (
    <AboutCard>
      <SectionBadge icon={ShieldAlert}>10</SectionBadge>
      <SectionTitle>ガイドライン違反への対応</SectionTitle>
      <p className={paragraph}>
        本ガイドラインまたは利用規約に違反する投稿を発見した場合、運営は必要に応じて以下の対応を行うことがあります。
      </p>
      <NoteList items={RESPONSE_ITEMS} />
      <div className="mt-6 space-y-4">
        <p className={paragraph}>
          重大な違反や、他の利用者に危害を与えるおそれがある場合には、事前の通知なく対応を行う場合があります。
        </p>
        <p className={paragraph}>
          同様の違反を繰り返す利用者については、本サービスの利用停止やアカウント削除等の措置を行う場合があります。
        </p>
        <p className={paragraph}>
          また、投稿内容が他者の名誉、プライバシー、著作権、肖像権その他の権利を侵害する場合、または犯罪行為その他の違法行為に該当する可能性がある場合には、必要に応じて、関係機関への相談・通報、その他の法的措置を講じる場合があります。
        </p>
        <p className={paragraph}>
          なお、投稿の削除・非公開等の対応を行う場合であっても、運営がすべての投稿内容を事前に確認・監視することを保証するものではありません。
        </p>
      </div>
    </AboutCard>
  );
}
