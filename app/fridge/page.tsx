"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { IngredientRow } from "@/components/IngredientRow";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TrashIcon } from "@/components/icons";
import { deleteIngredient, getFridge, seedFridge } from "@/lib/api";
import type { Ingredient } from "@/lib/types";

export default function FridgePage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Ingredient | null>(null);
  const [busy, setBusy] = useState(false);

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
        <ul className="flex flex-col gap-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <IngredientRow
                emoji={item.emoji}
                name={item.name}
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
