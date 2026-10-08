"use client";

import { Eye } from "lucide-react";

import { SegmentControl } from "@/components/atoms/SegmentControl";
import type { EditPreviewMode } from "@/hooks/useEditPreviewMode";

// useEditPreviewMode の switchProps をそのまま渡す
type EditPreviewSwitchProps = {
  mode: EditPreviewMode;
  onChange: (mode: EditPreviewMode) => void;
  // 切替の操作でフォーカスが移る前に呼ぶ処理。入力中の項目の判定に使うため必須にしている
  onPointerDownCapture: () => void;
  onKeyDownCapture: () => void;
};

// 投稿画面の入力/プレビュー切替。スクロール中も画面右上に固定で表示する。
// フル画面時にフォーム項目の右上へ重ならないよう、max-w-5xl の右端ではなく
// 画面（main の内容幅）の右端へ寄せるため、呼び出し側は全幅の要素の中に置く。
// ラッパーを全幅にすると固定中の帯が下の入力欄や目次のクリックを妨げるため、
// w-fit + ml-auto でピルの幅だけに縮める。
export function EditPreviewSwitch({
  mode,
  onChange,
  onPointerDownCapture,
  onKeyDownCapture,
}: Readonly<EditPreviewSwitchProps>) {
  return (
    <div
      className="sticky top-20 z-30 ml-auto w-fit"
      onPointerDownCapture={onPointerDownCapture}
      onKeyDownCapture={onKeyDownCapture}
    >
      <SegmentControl
        value={mode}
        onChange={onChange}
        aria-label="入力とプレビューの切り替え"
        options={[
          { value: "edit", label: "入力" },
          { value: "preview", label: "プレビュー", icon: Eye },
        ]}
      />
    </div>
  );
}
