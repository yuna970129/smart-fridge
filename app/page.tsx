import Link from "next/link";

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

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12">
      <div className="animate-fade-up mb-10 text-center">
        <div className="mb-3 text-6xl">🧊</div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Fridge AI
        </h1>
        <p className="mt-2 text-ink-soft">Your smart kitchen companion</p>
      </div>

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
