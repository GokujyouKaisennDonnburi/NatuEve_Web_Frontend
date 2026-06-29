import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

type EditIconButtonProps = {
  onClick?: () => void;
  className?: string;
  label?: string;
};

export function EditIconButton({
  onClick,
  className,
  label = "編集する",
}: EditIconButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
        "h-6 w-6 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors",
        className,
      )}
      title={label}
      aria-label={label}
    >
      <Pencil className="h-3.5 w-3.5" />
    </Button>
  );
}
