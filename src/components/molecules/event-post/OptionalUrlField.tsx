import { FieldNote } from "@/components/atoms/event-post/FieldNote";
import { TogglePill } from "@/components/atoms/event-post/TogglePill";
import { FormField } from "@/components/molecules/event-post/FormField";
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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">外部URL</p>
          <FieldNote>外部フォームに遷移させる場合に使います。</FieldNote>
        </div>
        <TogglePill
          id={toggleId}
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
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
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          OFF の間は外部URLの入力欄を非表示にします。
        </div>
      )}
    </div>
  );
}
