"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { IngredientRow } from "@/components/IngredientRow";
import { FreshnessDot } from "@/components/FreshnessDot";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TrashIcon } from "@/components/icons";
import { deleteIngredient, getFridge, seedFridge } from "@/lib/api";
import { freshnessLabel, type FreshIngredient } from "@/lib/freshness";
import { cn } from "@/lib/cn";

type Filter = "all" | "fresh" | "expiring";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fresh", label: "Fresh" },
  { key: "expiring", label: "Expiring" },
];

function initialFilter(): Filter {
  if (typeof window === "undefined") return "all";
  const f = new URLSearchParams(window.location.search).get("filter");
  return f === "fresh" || f === "expiring" ? f : "all";
}

export default function FridgePage() {
  const [items, setItems] = useState<FreshIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<FreshIngredient | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<Filter>(initialFilter);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getFridge();
        if (active) setItems(data);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Could not load your fridge.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const visible = useMemo(() => {
    if (filter === "fresh") return items.filter((i) => i.freshness === "fresh");
    if (filter === "expiring")
      return items.filter((i) => i.freshness !== "fresh");
    return items;
  }, [items, filter]);

  async function confirmDelete() {
    if (!target) return;
    const id = target.id;
    setBusy(true);
    try {
      await deleteIngredient(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete item.");
    } finally {
      setBusy(false);
    }
  }

  async function loadDemo() {
    setBusy(true);
    setError(null);
    try {
      setItems(await seedFridge());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load demo items.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      backHref="/"
      title="📋 My Fridge"
      subtitle={
        items.length > 0
          ? `${items.length} ingredient${items.length === 1 ? "" : "s"}`
          : undefined
      }
    >
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-soft">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-8 text-center">
          <div className="text-5xl">🧊</div>
          <div>
            <p className="text-lg font-medium text-ink">Your fridge is empty</p>
            <p className="mt-1 text-sm text-ink-soft">
              Scan a receipt to add ingredients.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 pt-2">
            <Link href="/scan-receipt" className="w-full">
              <Button size="lg" className="w-full">
                📸 Scan a Receipt
              </Button>
            </Link>
            <Button variant="secondary" disabled={busy} onClick={loadDemo}>
              Load demo items
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition duration-300",
                  filter === f.key
                    ? "bg-gold text-ink shadow-soft"
                    : "bg-white/55 text-ink-soft hover:bg-white/80",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="rounded-2xl bg-teal/60 px-4 py-6 text-center text-ink-soft shadow-soft">
              No {filter} items.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visible.map((item) => (
                <li key={item.id}>
                  <IngredientRow
                    emoji={item.emoji}
                    name={item.name}
                    leading={<FreshnessDot level={item.freshness} />}
                    subtitle={
                      <span
                        className={cn(
                          item.freshness === "expired" && "text-rose-600",
                          item.freshness === "expiring" && "text-amber-600",
                        )}
                      >
                        {item.freshness === "expired"
                          ? "Expired!"
                          : freshnessLabel(item.days_left)}
                      </span>
                    }
                    trailing={
                      <button
                        type="button"
                        aria-label={`Delete ${item.name}`}
                        onClick={() => setTarget(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-soft transition duration-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <TrashIcon />
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <ConfirmDialog
        open={target !== null}
        title={target ? `Delete ${target.name}?` : ""}
        message="This will remove it from your fridge."
        confirmLabel={busy ? "Deleting…" : "Yes, delete"}
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => (busy ? null : setTarget(null))}
      />
    </Screen>
  );
}
