import { CalendarDays, ListChecks } from "lucide-react";

import { FormInput } from "@/components/atoms/FormInput";
import { FormTextarea } from "@/components/atoms/FormTextarea";
import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { AboutCard } from "@/components/molecules/about/AboutCard";
import { MAX_TEXT_LENGTH } from "@/constants/config";

const EVENT_INFO_ITEMS = [
  "イベントの目的",
  "イベントの内容",
  "対象者",
  "注意事項",
  "その他、参加者に必要な情報",
];

// 実フォーム（EventPostForm）と同じ構成の見本入力欄。
// どちらも value/onChange を持たない非制御入力のため、入力はできるがどこにも保存されない。
function EventTitleFieldExample() {
  return (
    <div className="my-5">
      <FormCard>
        <FormField id="guideline-event-title" label="イベントタイトル" required>
          <FormInput
            id="guideline-event-title"
            maxLength={MAX_TEXT_LENGTH}
            placeholder="例: 里山観察ワークショップ"
          />
        </FormField>
      </FormCard>
    </div>
  );
}

function EventOverviewFieldExample() {
  return (
    <div className="my-5">
      <FormCard>
        <FormField
          id="guideline-event-overview"
          label="イベント概要"
          required
          description="一覧やカードに表示される紹介文です。"
        >
          <FormTextarea
            id="guideline-event-overview"
            rows={5}
            className="max-h-60 resize-y overflow-y-auto"
            placeholder="一日のスケジュールや、イベントで何を行うかを書きましょう。"
          />
        </FormField>
      </FormCard>
    </div>
  );
}

// 3. イベント投稿ガイドライン
export function GuidelineEventPostSection() {
  return (
    <AboutCard>
      <SectionBadge icon={CalendarDays}>イベント投稿ガイドライン</SectionBadge>
      <SectionTitle>イベントを作成するときの注意点</SectionTitle>
      <p className="text-base leading-[1.8] text-[#333]">
        イベントを作成するときは、以下の点に注意してください。
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#2D401A]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF5DF] text-sm font-black text-[#5C781E]">
              1
            </span>
            イベントタイトルを分かりやすく設定する
          </h3>
          <EventTitleFieldExample />
          <p className="text-base leading-[1.8] text-[#333]">
            イベントタイトルは、イベントの内容が参加者に伝わるよう、具体的で分かりやすい名称を設定してください。
          </p>
          <p className="mt-2 text-base leading-[1.8] text-[#333]">
            イベントの内容が分からない名称や、誤解を招く表現は避けてください。
          </p>
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-[#2D401A]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EEF5DF] text-sm font-black text-[#5C781E]">
              2
            </span>
            イベント内容を具体的に記載する
          </h3>
          <EventOverviewFieldExample />
          <p className="text-base leading-[1.8] text-[#333]">
            イベントの説明には、可能な範囲で以下の情報を記載してください。
          </p>
          <ul className="mt-3 space-y-2">
            {EVENT_INFO_ITEMS.map((text) => (
              <li
                key={text}
                className="flex items-start gap-2 text-base text-[#333]"
              >
                <ListChecks className="mt-0.5 size-4 shrink-0 text-[#85A928]" />
                {text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-base leading-[1.8] text-[#333]">
            参加者がイベントページを見ただけで、「どのようなイベントなのか」「自分が参加できるのか」「参加するために何が必要なのか」が分かる内容を心がけてください。
          </p>
        </section>
      </div>
    </AboutCard>
  );
}
