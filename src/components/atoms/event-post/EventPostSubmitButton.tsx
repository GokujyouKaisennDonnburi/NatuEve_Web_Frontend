import { ArrowRight } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EventPostSubmitButtonProps = ComponentPropsWithoutRef<typeof Button>;

export function EventPostSubmitButton({
  className,
  children,
  ...props
}: Readonly<EventPostSubmitButtonProps>) {
  return (
    <Button
      {...props}
      className={cn(
        "min-w-48 rounded-full bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-600 px-6 py-6 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:-translate-y-px hover:shadow-xl hover:shadow-teal-500/30 focus-visible:ring-teal-500/30",
        className,
      )}
    >
      <span>{children}</span>
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
