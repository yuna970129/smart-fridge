// Client-side voice helpers: capture mic audio as PCM16 16kHz and stream it
// (or the bundled demo voice) to /api/voice/transcribe, surfacing live text.

export interface MicRecorder {
  stop: () => Promise<Int16Array>;
}

/** Start capturing the microphone, accumulating PCM16 16kHz samples. */
export async function startMicRecording(): Promise<MicRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext();
  await ctx.audioWorklet.addModule("/pcm16-worklet.js");
  const source = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "pcm16-downsampler");

  const chunks: Int16Array[] = [];
  node.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
    chunks.push(new Int16Array(e.data));
  };
  source.connect(node);
  // Worklet needs a sink to keep pulling input; route to a muted gain.
  const sink = ctx.createGain();
  sink.gain.value = 0;
  node.connect(sink);
  sink.connect(ctx.destination);

  return {
    async stop() {
      source.disconnect();
      node.disconnect();
      sink.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      await ctx.close();
      const total = chunks.reduce((n, c) => n + c.length, 0);
      const merged = new Int16Array(total);
      let off = 0;
      for (const c of chunks) {
        merged.set(c, off);
        off += c.length;
      }
      return merged;
    },
  };
}

function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export interface TranscribeCallbacks {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onMock?: (mock: boolean) => void;
}

/**
 * Stream audio to the backend and parse the NDJSON event stream. Pass either
 * recorded `pcm` or `{ useMock: true }` to use the bundled demo voice.
 * Resolves with the full final transcript.
 */
export async function transcribe(
  opts: { pcm?: Int16Array; useMock?: boolean },
  cb: TranscribeCallbacks = {},
): Promise<string> {
  const body =
    opts.useMock || !opts.pcm
      ? { useMock: true }
      : { pcm: int16ToBase64(opts.pcm) };

  const res = await fetch("/api/voice/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.body) throw new Error("No response stream.");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalText = "";

  const handle = (line: string) => {
    if (!line.trim()) return;
    let ev: {
      type: string;
      text?: string;
      isFinal?: boolean;
      mock?: boolean;
      error?: string;
    };
    try {
      ev = JSON.parse(line);
    } catch {
      return;
    }
    if (ev.type === "status") cb.onMock?.(Boolean(ev.mock));
    else if (ev.type === "chunk") {
      if (ev.isFinal) {
        finalText = finalText ? `${finalText} ${ev.text}` : ev.text ?? "";
        cb.onFinal?.(finalText);
      } else cb.onInterim?.(ev.text ?? "");
    } else if (ev.type === "done") {
      if (ev.text) finalText = ev.text;
    } else if (ev.type === "error") {
      throw new Error(ev.error || "Transcription failed.");
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handle(line);
  }
  if (buffer) handle(buffer);
  return finalText.trim();
}

export interface VoiceCommandResult {
  action: "add" | "consume";
  dishName?: string;
  items: Array<{
    id?: string;
    name: string;
    emoji: string;
    shelf_life_days?: number;
  }>;
  mock: boolean;
}

export async function runVoiceCommand(
  transcript: string,
): Promise<VoiceCommandResult> {
  const res = await fetch("/api/voice/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not understand that.");
  return data as VoiceCommandResult;
}
