import { StepBadge } from "@/components/atoms/participation/StepBadge";

// StepBadge 1件分の表示情報
export type ParticipationStepView = {
  key: string;
  label: string;
  indicator: number | "check";
  isActive: boolean;
  isCurrent: boolean;
};

type ParticipationStepperProps = {
  steps: ParticipationStepView[];
};

// StepBadge を横に並べ、間を細い横線でつなぐ
export function ParticipationStepper({
  steps,
}: Readonly<ParticipationStepperProps>) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center gap-2">
          {/* 区切り線は要素の間だけに入れる（先頭の前には出さない） */}
          {index > 0 ? (
            <span
              aria-hidden="true"
              className="h-px w-5 shrink-0 bg-slate-300"
            />
          ) : null}
          <StepBadge
            isActive={step.isActive}
            indicator={step.indicator}
            isCurrent={step.isCurrent}
            label={step.label}
          />
        </div>
      ))}
    </div>
  );
}
