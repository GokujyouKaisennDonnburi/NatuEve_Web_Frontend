"use client";

import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

// アプリ共通で利用するツールチップのプロパティ
type AppTooltipProps = {
  children: ReactNode;
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
};

// アプリ共通のツールチップコンポーネント(矢印なし用に調整)
export function AppTooltip({
  children,
  label,
  side = "left",
  sideOffset = 8,
}: Readonly<AppTooltipProps>) {
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>

        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              "z-50",
              "rounded-lg border border-slate-200 bg-white",
              "px-3 py-2",
              "text-sm font-medium text-slate-700",
              "shadow-lg",
              "origin-(--radix-tooltip-content-transform-origin)",
              "animate-in fade-in-0 zoom-in-95",
              "data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0",
              "data-[state=closed]:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2",
              "data-[side=left]:slide-in-from-right-2",
              "data-[side=right]:slide-in-from-left-2",
              "data-[side=top]:slide-in-from-bottom-2",
            )}
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
