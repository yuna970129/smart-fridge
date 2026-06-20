import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function IngredientRow({
  emoji,
  name,
  subtitle,
  leading,
  trailing,
  className,
}: {
  emoji: string;
  name: string;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-teal/70 px-4 py-3.5 shadow-soft backdrop-blur-sm",
        className,
      )}
    >
      {leading}
      <span className="text-2xl leading-none" aria-hidden>
        {emoji}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[17px] font-medium text-ink">{name}</span>
        {subtitle && (
          <span className="text-[13px] leading-tight text-ink-soft">
            {subtitle}
          </span>
        )}
      </span>
      {trailing}
    </div>
  );
}
