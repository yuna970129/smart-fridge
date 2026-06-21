import { promises as fs } from "fs";
import path from "path";
import WebSocket from "ws";
import { bizcrushApiKey, hasBizcrush } from "./config";

/** True when no BizCrush key is configured and the mock provider is used. */
export const usingMockSTT = !hasBizcrush;

const BIZCRUSH_WS = "wss://extapi.bizcrush.ai/v1/stt/stream";
const FRAME_BYTES = 640; // 20ms of PCM16 @ 16kHz
const FRAME_MS = 20;

export interface SttEvent {
  text: string;
  isFinal: boolean;
  mock?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Load the bundled mock voice ("I made ramen with an egg") as PCM16 16kHz. */
export async function loadMockVoicePcm(): Promise<Buffer> {
  const p = path.join(process.cwd(), "public", "mock-voice.pcm");
  return fs.readFile(p);
}

/** Wrap raw PCM16 (mono) in a minimal WAV container for Gemini audio input. */
export function pcmToWav(pcm: Buffer, sampleRate = 16000): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** The bundled mock voice as a WAV (for the Gemini-direct demo). */
export async function loadMockVoiceWav(): Promise<Buffer> {
  return pcmToWav(await loadMockVoicePcm());
}

/**
 * Stream PCM16 (16kHz mono) audio to the BizCrush live STT WebSocket and yield
 * interim/final transcription events. Frames are paced at ~real time so the
 * caller can surface live partial results.
 *
 * Falls back to a deterministic word-by-word mock when no API key is set.
 */
export async function* transcribePcm(
  pcm: Buffer,
): AsyncGenerator<SttEvent, void, unknown> {
  if (!hasBizcrush) {
    yield* mockTranscribe();
    return;
  }

  const url = `${BIZCRUSH_WS}?api_key=${bizcrushApiKey}&format=json`;
  const ws = new WebSocket(url);

  // Bridge the event-based WS into an async queue we can yield from.
  const queue: SttEvent[] = [];
  let done = false;
  let err: Error | null = null;
  let wake: (() => void) | null = null;
  const push = (e: SttEvent) => {
    queue.push(e);
    wake?.();
  };
  const finish = (e?: Error) => {
    if (e) err = e;
    done = true;
    wake?.();
  };

  ws.on("open", () => {
    ws.send(JSON.stringify({ encoding: "pcm16" }));
  });
  ws.on("message", async (data) => {
    let msg: { connected?: boolean; chunk?: { text: string; is_final: boolean } };
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (msg.connected) {
      // Stream the audio in real-time-paced 20ms frames, then signal end.
      (async () => {
        try {
          for (let i = 0; i < pcm.length; i += FRAME_BYTES) {
            if (ws.readyState !== WebSocket.OPEN) break;
            ws.send(pcm.subarray(i, i + FRAME_BYTES));
            await sleep(FRAME_MS);
          }
          if (ws.readyState === WebSocket.OPEN) ws.send(Buffer.alloc(0));
        } catch {
          /* socket closed mid-send */
        }
      })();
    } else if (msg.chunk) {
      push({ text: msg.chunk.text, isFinal: msg.chunk.is_final });
    }
  });
  ws.on("error", (e) => finish(e as Error));
  ws.on("close", () => finish());

  // Safety timeout so a stalled socket can't hang the request forever.
  const timeout = setTimeout(() => {
    try {
      ws.terminate();
    } catch {
      /* ignore */
    }
    finish();
  }, 30_000);

  try {
    while (true) {
      while (queue.length) yield queue.shift()!;
      if (done) break;
      await new Promise<void>((resolve) => (wake = resolve));
    }
    while (queue.length) yield queue.shift()!;
    if (err) throw err;
  } finally {
    clearTimeout(timeout);
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }
}

const MOCK_TRANSCRIPT = "I made ramen with an egg";

/** Word-by-word mock so the voice flow is demoable without a BizCrush key. */
async function* mockTranscribe(): AsyncGenerator<SttEvent, void, unknown> {
  const words = MOCK_TRANSCRIPT.split(" ");
  let acc = "";
  for (const w of words) {
    acc = acc ? `${acc} ${w}` : w;
    await sleep(180);
    yield { text: acc, isFinal: false, mock: true };
  }
  await sleep(150);
  yield { text: MOCK_TRANSCRIPT, isFinal: true, mock: true };
}
