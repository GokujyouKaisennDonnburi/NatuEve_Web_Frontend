import { FieldNote } from "@/components/atoms/FieldNote";
import { TogglePill } from "@/components/atoms/event-post/TogglePill";
import { FormField } from "@/components/molecules/FormField";
import { Input } from "@/components/ui/input";

// 外部URLの入力欄を表示するコンポーネントのプロパティを定義
type OptionalUrlFieldProps = {
  id: string;
  toggleId: string;
  enabled: boolean;
  url: string;
  error?: string;
  onEnabledChange: (enabled: boolean) => void;
  onUrlChange: (url: string) => void;
};

// 外部URLの入力欄を表示するコンポーネント
export function OptionalUrlField({
  id,
  toggleId,
  enabled,
  url,
  error,
  onEnabledChange,
  onUrlChange,
}: Readonly<OptionalUrlFieldProps>) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-[#F8FAF6] p-4 shadow-sm shadow-slate-100">
      <div className="flex items-center gap-4">
        <TogglePill
          id={toggleId}
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-slate-900">
            外部サイトのレポートを使う
          </p>
          <FieldNote>オンにすると、以下の記入欄は不要になります。</FieldNote>
        </div>
      </div>

      {/* URL入力欄を表示する部分。enabled が true のときに表示される。 */}
      {enabled ? (
        <FormField
          id={id}
          label="外部URL"
          required={false}
          hint="URL は公開前に動作確認しておくと安心です。"
          error={error}
          className="space-y-2"
        >
          <Input
            id={id}
            type="url"
            maxLength={255}
            inputMode="url"
            placeholder="https://example.com/application"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </FormField>
      ) : null}
    </div>
  );
}
