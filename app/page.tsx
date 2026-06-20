import Link from "next/link";
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
    href: "/fridge",
    emoji: "📋",
    title: "My Fridge",
    desc: "See and manage your ingredients",
  },
];

async function getAttentionCount(): Promise<number> {
  try {
    const items = await getStore().list("have");
    return items
      .map((i) => withFreshness(i))
      .filter((i) => i.freshness !== "fresh").length;
  } catch {
    return 0;
  }
}

export default async function Home() {
  const attention = await getAttentionCount();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="animate-fade-up mb-6 text-center">
        <div className="mb-3 text-6xl">🧊</div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Fridge AI
        </h1>
        <p className="mt-2 text-ink-soft">Your smart kitchen companion</p>
      </div>

      {attention > 0 && (
        <Link
          href="/fridge?filter=expiring"
          className="animate-fade-up mb-6 flex items-center gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 shadow-soft backdrop-blur-sm transition duration-300 hover:bg-amber-100/80"
        >
          <span className="text-xl">⚠️</span>
          <span className="text-[15px] font-semibold text-amber-700">
            ALERT: {attention} item{attention === 1 ? "" : "s"} expiring!
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
