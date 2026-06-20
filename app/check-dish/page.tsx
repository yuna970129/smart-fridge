"use client";

import { useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/Badge";
import { UploadCard } from "@/components/UploadCard";
import { SparkleIcon } from "@/components/icons";
import { checkDish, setIngredientStatus } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Ingredient } from "@/lib/types";

type Step = "upload" | "loading" | "results" | "done";
type Row = { item: Ingredient; used: boolean };

export default function CheckDishPage() {
  const [step, setStep] = useState<Step>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [dishName, setDishName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [mock, setMock] = useState(false);
  const [removedCount, setRemovedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!image) return;
    setError(null);
    setStep("loading");
    try {
      const { dishName, ingredients, mock } = await checkDish(image);
      setDishName(dishName);
      setRows(ingredients.map((item) => ({ item, used: false })));
      setMock(mock);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("upload");
    }
  }

  async function confirm() {
    setError(null);
    setStep("loading");
    try {
      const used = rows.filter((r) => r.used);
      await Promise.all(used.map((r) => setIngredientStatus(r.item.id, "gone")));
      setRemovedCount(used.length);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your fridge.");
      setStep("results");
    }
  }

  function reset() {
    setImage(null);
    setRows([]);
    setDishName("");
    setError(null);
    setStep("upload");
  }

  return (
    <Screen backHref="/" title="🍽️ Check Dish">
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-soft">
          {error}
        </p>
      )}

      {step === "upload" && (
        <div className="flex flex-col gap-5">
          <p className="text-[15px] text-ink-soft">
            Upload a photo of your cooked dish. AI will guess which fridge
            ingredients you used.
          </p>
          <UploadCard image={image} onImage={setImage} />
          <Button size="lg" disabled={!image} onClick={analyze}>
            <SparkleIcon /> Analyze Dish
          </Button>
        </div>
      )}

      {step === "loading" && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
          <Spinner />
          <div>
            <p className="text-lg font-medium text-ink">Analyzing…</p>
            <p className="text-sm text-ink-soft">
              Identifying the dish and ingredients
            </p>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="flex flex-col gap-5">
          <div className="glass rounded-2xl px-4 py-3 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-soft">Dish</p>
              {mock && <Badge>Demo mode</Badge>}
            </div>
            <p className="text-xl font-semibold text-ink">{dishName}</p>
          </div>

          {rows.length === 0 ? (
            <div className="rounded-2xl bg-teal/60 px-4 py-6 text-center text-ink-soft shadow-soft">
              <p>No fridge ingredients matched this dish.</p>
              <p className="mt-1 text-sm">
                Try another photo, or scan a receipt to stock your fridge first.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[15px] font-medium text-ink">
                Did you use these?
              </p>
              <ul className="flex flex-col gap-3">
                {rows.map((row, i) => (
                  <li
                    key={row.item.id}
                    className="rounded-2xl bg-teal/70 px-4 py-3.5 shadow-soft"
                  >
                    <div className="mb-2.5 flex items-center gap-3">
                      <span className="text-2xl leading-none">
                        {row.item.emoji}
                      </span>
                      <span className="text-[17px] font-medium text-ink">
                        {row.item.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <ToggleButton
                        active={!row.used}
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, used: false } : r,
                            ),
                          )
                        }
                        tone="keep"
                      >
                        Still have
                      </ToggleButton>
                      <ToggleButton
                        active={row.used}
                        onClick={() =>
                          setRows((prev) =>
                            prev.map((r, idx) =>
                              idx === i ? { ...r, used: true } : r,
                            ),
                          )
                        }
                        tone="used"
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
                <Link href="/" className="w-full">
                  <Button variant="ghost" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </>
          )}

          {rows.length === 0 && (
            <div className="flex flex-col gap-3">
              <Button variant="secondary" onClick={reset}>
                Try Another Photo
              </Button>
              <Link href="/" className="w-full">
                <Button variant="ghost" className="w-full">
                  Home
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/40 text-3xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Fridge updated</h2>
            <p className="mt-1 text-ink-soft">
              {removedCount > 0
                ? `${removedCount} item${
                    removedCount === 1 ? "" : "s"
                  } removed from My Fridge.`
                : "No items were removed."}
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
        active
          ? activeClasses
          : "bg-white/55 text-ink-soft hover:bg-white/80",
      )}
    >
      {children}
    </button>
  );
}
