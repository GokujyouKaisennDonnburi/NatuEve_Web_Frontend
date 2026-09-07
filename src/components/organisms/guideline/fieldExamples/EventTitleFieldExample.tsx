import { FormInput } from "@/components/atoms/FormInput";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { MAX_TEXT_LENGTH } from "@/constants/config";

type EventTitleFieldExampleProps = {
  idPrefix?: string;
};

// 実フォーム（EventPostForm）と同じ構成のイベントタイトル入力欄の見本。
// value/onChange を持たない非制御入力のため、入力はできるがどこにも保存されない。
export function EventTitleFieldExample({
  idPrefix = "guideline",
}: Readonly<EventTitleFieldExampleProps>) {
  const id = `${idPrefix}-event-title-example`;

  return (
    <div className="my-5">
      <FormCard>
        <FormField id={id} label="イベントタイトル" required>
          <FormInput
            id={id}
            maxLength={MAX_TEXT_LENGTH}
            placeholder="例: 里山観察ワークショップ"
          />
        </FormField>
      </FormCard>
    </div>
  );
}
