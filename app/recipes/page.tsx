"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/Badge";
import { FreshnessDot } from "@/components/FreshnessDot";
import { getRecipes, setIngredientStatus, type Recipe } from "@/lib/api";
import { cn } from "@/lib/cn";

type Step = "list" | "detail" | "checklist" | "done";
type UseRow = { id: string; name: string; emoji: string; used: boolean };

export default function RecipesPage() {
  const [step, setStep] = useState<Step>("list");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Recipe | null>(null);
  const [useRows, setUseRows] = useState<UseRow[]>([]);
  const [removedCount, setRemovedCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getRecipes();
        if (!active) return;
        setRecipes(data.recipes);
        setMock(data.mock);
        setEmpty(Boolean(data.empty));
      } catch (e) {
        if (active)
          setError(e instanceof Error ? e.message : "Could not load recipes.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  function openRecipe(r: Recipe) {
    setSelected(r);
    setStep("detail");
  }

  function startChecklist() {
    if (!selected) return;
    setUseRows(
      selected.fridgeIngredients.map((i) => ({
        id: i.id,
        name: i.name,
        emoji: i.emoji,
        used: true,
      })),
    );
    setStep("checklist");
  }

  async function confirm() {
    const used = useRows.filter((r) => r.used);
    setError(null);
    try {
      await Promise.all(used.map((r) => setIngredientStatus(r.id, "gone")));
      setRemovedCount(used.length);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your fridge.");
    }
  }

  return (
    <Screen
      backHref={step === "list" ? "/" : undefined}
      title="💡 Recommended Recipes"
    >
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-soft">
          {error}
        </p>
      )}

      {/* ---------- LIST ---------- */}
      {step === "list" &&
        (loading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4">
            <Spinner />
            <p className="text-sm text-ink-soft">Cooking up ideas…</p>
          </div>
        ) : empty || recipes.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-8 text-center">
            <div className="text-5xl">🍽️</div>
            <p className="text-lg font-medium text-ink">No recipes yet</p>
            <p className="-mt-2 text-sm text-ink-soft">
              Add some ingredients to your fridge first.
            </p>
            <Link href="/fridge" className="w-full">
              <Button size="lg" className="w-full">
                Go to My Fridge
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] text-ink-soft">
                Based on what&apos;s expiring in your fridge.
              </p>
              {mock && <Badge>Demo mode</Badge>}
            </div>
            {recipes.map((r, i) => (
              <button
                key={`${r.name}-${i}`}
                type="button"
                onClick={() => openRecipe(r)}
                className="glass flex flex-col gap-2 rounded-3xl p-5 text-left shadow-soft transition duration-300 hover:-translate-y-0.5 hover:bg-white/70 hover:shadow-soft-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{r.emoji}</span>
                  <span className="text-lg font-semibold text-ink">
                    {r.name}
                  </span>
                </div>
                <p className="text-sm text-ink-soft">
                  {[
                    ...r.fridgeIngredients.map((x) => x.name),
                    ...r.needToBuy,
                  ].join(", ")}
                </p>
                {r.usesOnlyFridge ? (
                  <span className="w-fit rounded-full bg-sage/40 px-3 py-1 text-xs font-medium text-ink">
                    ✓ Uses only fridge items
                  </span>
                ) : (
                  <span className="w-fit rounded-full bg-gold/30 px-3 py-1 text-xs font-medium text-ink">
                    ⚠️ Need to buy: {r.needToBuy.length} item
                    {r.needToBuy.length === 1 ? "" : "s"}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}

      {/* ---------- DETAIL ---------- */}
      {step === "detail" && selected && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{selected.emoji}</span>
            <h2 className="text-2xl font-semibold text-ink">{selected.name}</h2>
          </div>

          <section>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Required (from fridge)
            </h3>
            <ul className="flex flex-col gap-2">
              {selected.fridgeIngredients.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center gap-3 rounded-2xl bg-teal/70 px-4 py-3 shadow-soft"
                >
                  <FreshnessDot level={i.freshness} />
                  <span className="text-2xl leading-none">{i.emoji}</span>
                  <span className="flex-1 text-[16px] font-medium text-ink">
                    {i.name}
                  </span>
                  {i.freshness !== "fresh" && (
                    <span className="text-xs font-medium text-amber-600">
                      Expiring!
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {selected.needToBuy.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Need to buy
              </h3>
              <ul className="flex flex-wrap gap-2">
                {selected.needToBuy.map((n) => (
                  <li
                    key={n}
                    className="rounded-full bg-white/60 px-3 py-1.5 text-sm text-ink shadow-soft"
                  >
                    🛒 {n}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {selected.instructions.length > 0 && (
            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink-soft">
                Instructions
              </h3>
              <ol className="flex flex-col gap-2">
                {selected.instructions.map((s, idx) => (
                  <li key={idx} className="flex gap-3 text-[15px] text-ink">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/40 text-sm font-semibold">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="flex flex-col gap-3 pt-1">
            <Button
              size="lg"
              disabled={selected.fridgeIngredients.length === 0}
              onClick={startChecklist}
            >
              🍳 Cooked! (Next)
            </Button>
            <Button variant="ghost" onClick={() => setStep("list")}>
              ← Back
            </Button>
          </div>
        </div>
      )}

      {/* ---------- CHECKLIST ---------- */}
      {step === "checklist" && (
        <div className="flex flex-col gap-5">
          <p className="text-[15px] font-medium text-ink">Did you use these?</p>
          <ul className="flex flex-col gap-3">
            {useRows.map((row, i) => (
              <li
                key={row.id}
                className="rounded-2xl bg-teal/70 px-4 py-3.5 shadow-soft"
              >
                <div className="mb-2.5 flex items-center gap-3">
                  <span className="text-2xl leading-none">{row.emoji}</span>
                  <span className="text-[17px] font-medium text-ink">
                    {row.name}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ToggleButton
                    active={!row.used}
                    tone="keep"
                    onClick={() =>
                      setUseRows((prev) =>
                        prev.map((r, idx) =>
                          idx === i ? { ...r, used: false } : r,
                        ),
                      )
                    }
                  >
                    Still have
                  </ToggleButton>
                  <ToggleButton
                    active={row.used}
                    tone="used"
                    onClick={() =>
                      setUseRows((prev) =>
                        prev.map((r, idx) =>
                          idx === i ? { ...r, used: true } : r,
                        ),
                      )
                    }
                  >
                    Used all
                  </ToggleButton>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 pt-1">
            <Button size="lg" onClick={confirm}>
              Confirm
            </Button>
            <Button variant="ghost" onClick={() => setStep("detail")}>
              Back
            </Button>
          </div>
        </div>
      )}

      {/* ---------- DONE ---------- */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/40 text-3xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Fridge updated</h2>
            <p className="mt-1 text-ink-soft">
              {removedCount > 0
                ? `${removedCount} item${removedCount === 1 ? "" : "s"} removed.`
                : "No items removed."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 pt-2">
            <Link href="/fridge" className="w-full">
              <Button size="lg" className="w-full">
                View My Fridge
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button variant="ghost" className="w-full">
                Home
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Screen>
  );
}

function ToggleButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone: "keep" | "used";
  children: React.ReactNode;
}) {
  const activeClasses =
    tone === "keep"
      ? "bg-sage text-ink shadow-soft"
      : "bg-gold text-ink shadow-soft";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-300",
        active ? activeClasses : "bg-white/55 text-ink-soft hover:bg-white/80",
      )}
    >
      {children}
    </button>
  );
}
