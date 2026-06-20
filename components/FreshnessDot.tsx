import type { Freshness } from "@/lib/freshness";
import { cn } from "@/lib/cn";

const STYLES: Record<Freshness, string> = {
  fresh: "bg-[#6FAE6E]",
  expiring: "bg-[#E0A458]",
  expired: "bg-[#D98C8C]",
};

const LABELS: Record<Freshness, string> = {
  fresh: "Fresh",
  expiring: "Expiring soon",
  expired: "Expired",
};

export function FreshnessDot({
  level,
  className,
}: {
  level: Freshness;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={LABELS[level]}
      className={cn(
        "inline-block h-3 w-3 shrink-0 rounded-full ring-2 ring-white/70",
        STYLES[level],
        className,
      )}
    />
  );
}
