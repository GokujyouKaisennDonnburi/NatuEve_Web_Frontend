import { FormInput } from "@/components/atoms/FormInput";
import { FormCard } from "@/components/molecules/FormCard";
import { FormField } from "@/components/molecules/FormField";
import { MAX_TEXT_LENGTH } from "@/constants/config";

type ApplicationUrlFieldExampleProps = {
  idPrefix?: string;
};

// 実フォームの「申し込みURL」入力欄と同じ構成の見本（3.7 関連URL で掲載）。
// value/onChange を持たない非制御入力のため、入力はできるがどこにも保存されない。
export function ApplicationUrlFieldExample({
  idPrefix = "guideline",
}: Readonly<ApplicationUrlFieldExampleProps>) {
  const id = `${idPrefix}-application-url-example`;

  return (
    <div className="my-5">
      <FormCard>
        <FormField
          id={id}
          label="申し込みURL"
          description="外部フォームに遷移させる場合に使います。"
        >
          <FormInput
            id={id}
            type="url"
            inputMode="url"
            maxLength={MAX_TEXT_LENGTH}
            placeholder="https://（なちゅいべ内で受付する場合は空欄）"
          />
        </FormField>
      </FormCard>
    </div>
  );
}
