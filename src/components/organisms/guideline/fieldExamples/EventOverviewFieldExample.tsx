import { FormTextarea } from "@/components/atoms/FormTextarea";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";

type EventOverviewFieldExampleProps = {
  idPrefix?: string;
};

// 実フォーム（EventPostForm）と同じ構成のイベント概要入力欄の見本。
// value/onChange を持たない非制御入力のため、入力はできるがどこにも保存されない。
export function EventOverviewFieldExample({
  idPrefix = "guideline",
}: Readonly<EventOverviewFieldExampleProps>) {
  const id = `${idPrefix}-event-overview-example`;

  return (
    <div className="my-5">
      <FormCard>
        <FormField
          id={id}
          label="イベント概要"
          required
          description="一覧やカードに表示される紹介文です。"
        >
          <FormTextarea
            id={id}
            rows={5}
            className="max-h-60 resize-y overflow-y-auto"
            placeholder="一日のスケジュールや、イベントで何を行うかを書きましょう。"
          />
        </FormField>
      </FormCard>
    </div>
  );
}
