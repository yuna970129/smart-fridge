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
    expires_at?: string;
    days_left?: number;
    freshness?: import("./freshness").Freshness;
    adjusted?: boolean;
  }>;
  transcript?: string;
  mock: boolean;
}

export type VoiceProvider = "bizcrush" | "gemini";

/** Ask the server which voice engine is active (bizcrush vs gemini-direct). */
export async function getVoiceProvider(): Promise<VoiceProvider> {
  try {
    const res = await fetch("/api/voice/config", { cache: "no-store" });
    const data = await res.json();
    return data.provider === "gemini" ? "gemini" : "bizcrush";
  } catch {
    return "bizcrush";
  }
}

/** Wrap recorded PCM16 (mono 16kHz) into a base64 WAV for the audio endpoint. */
function pcm16ToWavBase64(pcm: Int16Array, sampleRate = 16000): string {
  const dataLen = pcm.byteLength;
  const buf = new ArrayBuffer(44 + dataLen);
  const v = new DataView(buf);
  const w = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, "RIFF");
  v.setUint32(4, 36 + dataLen, true);
  w(8, "WAVE");
  w(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, "data");
  v.setUint32(40, dataLen, true);
  new Uint8Array(buf, 44).set(
    new Uint8Array(pcm.buffer, pcm.byteOffset, dataLen),
  );
  // base64-encode
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/**
 * Gemini-only voice: send the recorded audio (or the bundled demo voice) to
 * Gemini in ONE call that transcribes AND parses the command.
 */
export async function runVoiceCommandAudio(opts: {
  pcm?: Int16Array;
  useMock?: boolean;
}): Promise<VoiceCommandResult> {
  const body =
    opts.useMock || !opts.pcm
      ? { useMock: true }
      : { audio: pcm16ToWavBase64(opts.pcm), mimeType: "audio/wav" };
  const res = await fetch("/api/voice/command-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not understand that.");
  return data as VoiceCommandResult;
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
