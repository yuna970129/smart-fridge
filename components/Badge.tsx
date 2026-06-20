import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white/55 px-3 py-1 text-xs font-medium text-ink-soft shadow-soft",
        className,
      )}
    >
      {children}
    </span>
  );
}
