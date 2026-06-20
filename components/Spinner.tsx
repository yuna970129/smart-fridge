import { cn } from "@/lib/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-10 w-10 animate-spin rounded-full border-[3px] border-white/60 border-t-gold-deep",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
