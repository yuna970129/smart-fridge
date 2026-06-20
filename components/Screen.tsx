import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowLeftIcon } from "@/components/icons";

export function Screen({
  children,
  title,
  subtitle,
  backHref,
  className,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  className?: string;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-12 pt-7 sm:pt-10">
      {backHref && (
        <Link
          href={backHref}
          className="mb-5 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft transition duration-300 hover:bg-white/50 hover:text-ink"
        >
          <ArrowLeftIcon /> Back
        </Link>
      )}

      {title && (
        <header className="mb-6 animate-fade-up">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[15px] text-ink-soft">{subtitle}</p>
          )}
        </header>
      )}

      <div className={cn("animate-fade-up", className)}>{children}</div>
    </main>
  );
}
