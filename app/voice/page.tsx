"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/Badge";
import { CheckIcon, MicIcon, StopIcon } from "@/components/icons";
import { addToFridge, setIngredientStatus } from "@/lib/api";
import {
  startMicRecording,
  transcribe,
  runVoiceCommand,
  type MicRecorder,
  type VoiceCommandResult,
} from "@/lib/voice";
import { cn } from "@/lib/cn";

type Step = "idle" | "listening" | "thinking" | "add" | "consume" | "done";
type AddRow = { name: string; emoji: string; shelf_life_days?: number; checked: boolean };
type UseRow = { id: string; name: string; emoji: string; used: boolean };

export default function VoicePage() {
  const [step, setStep] = useState<Step>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [recording, setRecording] = useState(false);
  const [sttMock, setSttMock] = useState(false);
  const [aiMock, setAiMock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dishName, setDishName] = useState("");
  const [addRows, setAddRows] = useState<AddRow[]>([]);
  const [useRows, setUseRows] = useState<UseRow[]>([]);
  const [doneMsg, setDoneMsg] = useState<{ verb: string; names: string[] }>({
    verb: "",
    names: [],
  });

  const recorderRef = useRef<MicRecorder | null>(null);

  async function startVoice() {
    setError(null);
    setTranscript("");
    setInterim("");
    setStep("listening");
    try {
      recorderRef.current = await startMicRecording();
      setRecording(true);
    } catch {
      recorderRef.current = null;
      setRecording(false);
      await runStt({ useMock: true });
    }
  }

  async function useDemoVoice() {
    setError(null);
    setTranscript("");
    setInterim("");
    setStep("listening");
    setRecording(false);
    await runStt({ useMock: true });
  }

  async function stopVoice() {
    const rec = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    let pcm: Int16Array | undefined;
    try {
      pcm = rec ? await rec.stop() : undefined;
    } catch {
      pcm = undefined;
    }
    await runStt(pcm && pcm.length > 1600 ? { pcm } : { useMock: true });
  }

  async function runStt(opts: { pcm?: Int16Array; useMock?: boolean }) {
    setInterim("");
    try {
      const text = await transcribe(opts, {
        onMock: setSttMock,
        onInterim: setInterim,
        onFinal: (t) => {
          setTranscript(t);
          setInterim("");
        },
      });
      const finalText = (text || interim).trim();
      if (!finalText) {
        setError("Didn't catch that. Please try again.");
        setStep("idle");
        return;
      }
      setTranscript(finalText);
      await routeCommand(finalText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice recognition failed.");
      setStep("idle");
    }
  }

  async function routeCommand(text: string) {
    setStep("thinking");
    try {
      const cmd: VoiceCommandResult = await runVoiceCommand(text);
      setAiMock(cmd.mock);
      if (cmd.action === "add") {
        if (!cmd.items.length) {
          setError("Didn't catch any groceries. Please try again.");
          setStep("idle");
          return;
        }
        setAddRows(cmd.items.map((i) => ({ ...i, checked: true })));
        setStep("add");
      } else {
        setDishName(cmd.dishName || "Home Dish");
        setUseRows(
          cmd.items.map((i) => ({
            id: i.id as string,
            name: i.name,
            emoji: i.emoji,
            used: true,
          })),
        );
        setStep("consume");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not understand that.");
      setStep("idle");
    }
  }

  async function confirmAdd() {
    const picked = addRows.filter((r) => r.checked);
    setStep("thinking");
    try {
      await addToFridge(picked.map(({ name, emoji }) => ({ name, emoji })));
      setDoneMsg({ verb: "Added to fridge", names: picked.map((r) => r.name) });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save items.");
      setStep("add");
    }
  }

  async function confirmConsume() {
    const used = useRows.filter((r) => r.used);
    setStep("thinking");
    try {
      await Promise.all(used.map((r) => setIngredientStatus(r.id, "gone")));
      setDoneMsg({ verb: "Removed from fridge", names: used.map((r) => r.name) });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update your fridge.");
      setStep("consume");
    }
  }

  function reset() {
    setTranscript("");
    setInterim("");
    setError(null);
    setAddRows([]);
    setUseRows([]);
    setDishName("");
    setStep("idle");
  }

  return (
    <Screen backHref="/" title="🎙️ Voice Command">
      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-soft">
          {error}
        </p>
      )}

      {step === "idle" && (
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <p className="text-[15px] text-ink-soft">
            Just talk — say what you <b>bought</b> or what you <b>cooked</b>, and
            I&apos;ll update your fridge.
          </p>
          <button
            type="button"
            onClick={startVoice}
            aria-label="Start speaking"
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gold text-ink shadow-soft-lg transition duration-300 hover:scale-105 hover:bg-gold-deep active:scale-95"
          >
            <MicIcon className="h-10 w-10" />
          </button>
          <div className="text-sm text-ink-soft">
            <p>e.g. &quot;I bought milk and apples&quot;</p>
            <p>or &quot;I made ramen with an egg&quot;</p>
          </div>
          <button
            type="button"
            onClick={useDemoVoice}
            className="text-sm font-medium text-ink-soft underline-offset-2 transition hover:text-ink hover:underline"
          >
            ▶ Use demo voice
          </button>
        </div>
      )}

      {step === "listening" && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                recording ? "animate-pulse bg-rose-500" : "bg-gold",
              )}
            />
            <span className="text-lg font-medium text-ink">
              {recording ? "Listening…" : "Recognizing…"}
            </span>
            {sttMock && <Badge>Demo mode</Badge>}
          </div>
          <p className="min-h-16 max-w-xs text-lg leading-relaxed text-ink">
            {transcript || <span className="text-ink-soft">{interim || "…"}</span>}
          </p>
          {recording ? (
            <Button size="lg" variant="danger" onClick={stopVoice}>
              <StopIcon /> Stop
            </Button>
          ) : (
            <Spinner />
          )}
        </div>
      )}

      {step === "thinking" && (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
          <Spinner />
          <p className="text-lg font-medium text-ink">Understanding…</p>
          {transcript && (
            <p className="max-w-xs text-sm text-ink-soft">“{transcript}”</p>
          )}
        </div>
      )}

      {step === "add" && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">🛒 Add these?</h2>
            {aiMock && <Badge>Demo mode</Badge>}
          </div>
          {transcript && (
            <p className="text-sm text-ink-soft">heard: “{transcript}”</p>
          )}
          <ul className="flex flex-col gap-2.5">
            {addRows.map((row, i) => (
              <li key={`${row.name}-${i}`}>
                <button
                  type="button"
                  onClick={() =>
                    setAddRows((prev) =>
                      prev.map((r, idx) =>
                        idx === i ? { ...r, checked: !r.checked } : r,
                      ),
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-2xl bg-teal/70 px-4 py-3 text-left shadow-soft transition duration-300 hover:bg-teal"
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition duration-300",
                      row.checked
                        ? "border-gold-deep bg-gold text-ink"
                        : "border-sage/70 bg-white/60 text-transparent",
                    )}
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
            <Button
              size="lg"
              disabled={!addRows.some((r) => r.checked)}
              onClick={confirmAdd}
            >
              Confirm &amp; Save
            </Button>
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === "consume" && (
        <div className="flex flex-col gap-5">
          <div className="glass rounded-2xl px-4 py-3 shadow-soft">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-soft">🍽️ Cooked</p>
              {aiMock && <Badge>Demo mode</Badge>}
            </div>
            <p className="text-xl font-semibold text-ink">{dishName}</p>
            {transcript && (
              <p className="mt-0.5 text-sm text-ink-soft">“{transcript}”</p>
            )}
          </div>

          {useRows.length === 0 ? (
            <div className="rounded-2xl bg-teal/60 px-4 py-6 text-center text-ink-soft shadow-soft">
              <p>No fridge ingredients matched.</p>
            </div>
          ) : (
            <>
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
            </>
          )}

          <div className="flex flex-col gap-3 pt-1">
            <Button size="lg" onClick={confirmConsume}>
              Confirm
            </Button>
            <Button variant="ghost" onClick={reset}>
              Back
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/40 text-3xl">
            ✅
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink">{doneMsg.verb}</h2>
            {doneMsg.names.length > 0 && (
              <p className="mt-1 text-ink-soft">{doneMsg.names.join(", ")}</p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3 pt-2">
            <Link href="/fridge" className="w-full">
              <Button size="lg" className="w-full">
                View My Fridge
              </Button>
            </Link>
            <Button variant="secondary" onClick={reset}>
              Say Another
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
    tone === "keep" ? "bg-sage text-ink shadow-soft" : "bg-gold text-ink shadow-soft";
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
