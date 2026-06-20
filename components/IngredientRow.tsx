import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function IngredientRow({
  emoji,
  name,
  trailing,
  className,
}: {
  emoji: string;
  name: string;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-teal/70 px-4 py-3.5 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="flex-1 text-[17px] font-medium text-ink">{name}</span>
      {trailing}
    </div>
  );
}
