"use client";

import { useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/Badge";
import { UploadCard } from "@/components/UploadCard";
import { CheckIcon, SparkleIcon } from "@/components/icons";
import { addToFridge, scanReceipt } from "@/lib/api";

type Step = "upload" | "loading" | "results" | "saved";
type Row = {
  name: string;
  emoji: string;
  shelf_life_days?: number;
  checked: boolean;
};

export default function ScanReceiptPage() {
  const [step, setStep] = useState<Step>("upload");
  const [image, setImage] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [mock, setMock] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkedCount = rows.filter((r) => r.checked).length;

  async function analyze() {
    if (!image) return;
    setError(null);
    setStep("loading");
    try {
      const { items, mock } = await scanReceipt(image);
      if (!items.length) {
        setError("No food items were found. Please try another photo.");
        setStep("upload");
        return;
      }
      setRows(items.map((i) => ({ ...i, checked: true })));
      setMock(mock);
      setStep("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStep("upload");
    }
  }

  async function save() {
    setError(null);
    setStep("loading");
    try {
      const selected = rows.filter((r) => r.checked);
      await addToFridge(
        selected.map(({ name, emoji, shelf_life_days }) => ({
          name,
          emoji,
          shelf_life_days,
        })),
      );
      setSavedCount(selected.length);
      setStep("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save items.");
      setStep("results");
    }
  }

  function reset() {
    setImage(null);
    setRows([]);
    setError(null);
    setStep("upload");
  }

  return (
    <Screen backHref="/" title="📸 Scan Receipt">
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-soft">
          {error}
        </p>
      )}

      {step === "upload" && (
        <div className="flex flex-col gap-5">
          <p className="text-[15px] text-ink-soft">
            Upload a receipt photo and let AI add the groceries to your fridge.
          </p>
          <UploadCard image={image} onImage={setImage} />
          <Button size="lg" disabled={!image} onClick={analyze}>
            <SparkleIcon /> Analyze Receipt
          </Button>
        </div>
      )}

      {step === "loading" && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
          <Spinner />
          <div>
            <p className="text-lg font-medium text-ink">Analyzing…</p>
            <p className="text-sm text-ink-soft">Reading your receipt</p>
          </div>
        </div>
      )}

      {step === "results" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Found in receipt</h2>
            {mock && <Badge>Demo mode</Badge>}
          </div>

          <ul className="flex flex-col gap-2.5">
            {rows.map((row, i) => (
              <li key={`${row.name}-${i}`}>
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) =>
                      prev.map((r, idx) =>
                        idx === i ? { ...r, checked: !r.checked } : r,
                      ),
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-2xl bg-teal/70 px-4 py-3 text-left shadow-soft transition duration-300 hover:bg-teal"
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition duration-300 ${
                      row.checked
                        ? "border-gold-deep bg-gold text-ink"
                        : "border-sage/70 bg-white/60 text-transparent"
                    }`}
                  >
                    <CheckIcon />
                  </span>
                  <span className="text-2xl leading-none">{row.emoji}</span>
                  <span className="flex-1 text-[17px] font-medium text-ink">
                    {row.name}
                    {row.shelf_life_days != null && (
                      <span className="ml-1.5 text-[14px] font-normal text-ink-soft">
                        (Avg {row.shelf_life_days}d)
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 pt-1">
            <Button size="lg" disabled={checkedCount === 0} onClick={save}>
              Confirm &amp; Save{checkedCount ? ` (${checkedCount})` : ""}
            </Button>
            <Button variant="ghost" onClick={reset}>
              Upload Again
            </Button>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/40 text-3xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">Saved to fridge</h2>
            <p className="mt-1 text-ink-soft">
              {savedCount} item{savedCount === 1 ? "" : "s"} added to My Fridge.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 pt-2">
            <Link href="/fridge" className="w-full">
              <Button size="lg" className="w-full">
                View My Fridge
              </Button>
            </Link>
            <Button variant="secondary" onClick={reset}>
              Scan Another
            </Button>
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
