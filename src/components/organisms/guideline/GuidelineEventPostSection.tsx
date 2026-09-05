import { CalendarDays, ListChecks } from "lucide-react";

import { SectionBadge } from "@/components/atoms/about/SectionBadge";
import { SectionTitle } from "@/components/atoms/about/SectionTitle";
import { AboutCard } from "@/components/molecules/about/AboutCard";

const EVENT_INFO_ITEMS = [
  "イベントの目的",
  "イベントの内容",
  "対象者",
  "注意事項",
  "その他、参加者に必要な情報",
];

// 入力欄の仮画像プレースホルダー
function InputPlaceholder({ label }: { label: string }) {
  return (
    <div className="my-5 rounded-xl border-2 border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#EEF5DF] px-2 py-0.5 text-[11px] font-bold text-[#5C781E]">
            {label}
          </span>
          <span className="rounded bg-[#D97706] px-2 py-0.5 text-[11px] font-bold text-white">
            必須
          </span>
        </div>
        <div className="h-10 rounded-lg border border-[#DCE8C8] bg-white" />
      </div>
      <p className="mt-3 text-center text-xs text-[#85A928]">※画像は仮です</p>
    </div>
  );
}

// テキストエリアの仮画像プレースホルダー
function TextareaPlaceholder({ label }: { label: string }) {
  return (
    <div className="my-5 rounded-xl border-2 border-dashed border-[#C8D9AB] bg-[#FAFBF7] p-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#EEF5DF] px-2 py-0.5 text-[11px] font-bold text-[#5C781E]">
            {label}
          </span>
          <span className="rounded bg-[#D97706] px-2 py-0.5 text-[11px] font-bold text-white">
            必須
          </span>
        </div>
        <div className="h-28 rounded-lg border border-[#DCE8C8] bg-white" />
      </div>
      <p className="mt-3 text-center text-xs text-[#85A928]">※画像は仮です</p>
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
          <InputPlaceholder label="イベントタイトル" />
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
          <TextareaPlaceholder label="イベント概要" />
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
