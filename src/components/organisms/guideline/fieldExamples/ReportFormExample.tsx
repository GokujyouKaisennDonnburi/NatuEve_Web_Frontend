"use client";

import { useState } from "react";

import type { ReportPostFormState } from "@/components/organisms/report-post/ReportPostForm";
import { ReportPostForm } from "@/components/organisms/report-post/ReportPostForm";

// 実際のレポート作成画面（ReportPostForm）と同じ見た目の見本。
// 入力はローカル状態に反映されるが、送信・キャンセルは何も行わないため保存も遷移もされない。
export function ReportFormExample() {
  const [formState, setFormState] = useState<ReportPostFormState>({
    content: "",
    reportImages: [],
    externalUrlEnabled: false,
    externalUrl: "",
    reportPdfs: [],
  });

  return (
    <div className="my-5">
      <ReportPostForm
        formState={formState}
        validationErrors={{}}
        setFormState={setFormState}
        onSubmit={() => {}}
        onCancel={() => {}}
        isSubmitting={false}
      />
    </div>
  );
}
