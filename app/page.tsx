import Link from "next/link";
import Image from "next/image";
import { getStore } from "@/lib/store";
import { withFreshness } from "@/lib/freshness";

export const dynamic = "force-dynamic";

const actions = [
  {
    href: "/scan-receipt",
    emoji: "📸",
    title: "Scan Receipt",
    desc: "Add groceries from a receipt photo",
  },
  {
    href: "/check-dish",
    emoji: "🍽️",
    title: "Check Dish",
    desc: "Update your fridge after cooking",
  },
  {
    href: "/voice",
    emoji: "🎙️",
    title: "Voice Command",
    desc: "Add or remove items by voice",
  },
  {
    href: "/fridge",
    emoji: "🧊",
    title: "My Fridge",
    desc: "See and manage your ingredients",
  },
];

async function getExpiring(): Promise<string[]> {
  try {
    const items = await getStore().list("have");
    return items
      .map((i) => withFreshness(i))
      .filter((i) => i.freshness !== "fresh")
      .sort((a, b) => a.days_left - b.days_left)
      .map((i) => i.name);
  } catch {
    return [];
  }
}

export default async function Home() {
  const expiring = await getExpiring();
  const attention = expiring.length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="animate-fade-up mb-6 text-center">
        <Image src="/banner.webp" alt="Fridge AI" width={120} height={120} className="mx-auto mb-1" priority />
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          What's Left
        </h1>
        <p className="mt-2 text-ink-soft">Your smart kitchen companion</p>
      </div>

      <Link
        href="/voice?setup=1"
        className="animate-fade-up mb-4 flex items-center gap-3 rounded-2xl bg-gold/30 px-4 py-3 shadow-soft backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-gold/45"
      >
        <span className="text-xl">👋</span>
        <span className="flex flex-col">
          <span className="text-[15px] font-semibold text-ink">
            New here? Tell us what you have
          </span>
          <span className="text-[13px] text-ink-soft">(tap to record)</span>
        </span>
      </Link>

      {attention > 0 && (
        <Link
          href="/recipes"
          className="animate-fade-up mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 shadow-soft backdrop-blur-sm transition duration-300 hover:bg-amber-100/80"
        >
          <span className="text-xl">⚠️</span>
          <span className="flex flex-col">
            <span className="text-[15px] font-semibold text-amber-700">
              {expiring.slice(0, 2).join(", ")}
              {attention > 2 ? ` +${attention - 2} more` : ""} expiring
            </span>
            <span className="text-[13px] text-amber-700/80">
              Tap for recipe ideas →
            </span>
          </span>
        </Link>
      )}

      <nav className="flex flex-col gap-4">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="glass animate-fade-up group flex items-center gap-4 rounded-3xl p-5 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-soft-lg"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold/30 text-3xl">
              {a.emoji}
            </span>
            <span className="flex flex-col">
              <span className="text-lg font-semibold text-ink">{a.title}</span>
              <span className="text-sm text-ink-soft">{a.desc}</span>
            </span>
          </Link>
        ))}
      </nav>
    </main>
  );
}
