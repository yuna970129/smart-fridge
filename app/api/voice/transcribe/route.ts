import { NextRequest } from "next/server";
import { transcribePcm, loadMockVoicePcm, usingMockSTT } from "@/lib/bizcrush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/voice/transcribe
// Body: { pcm?: base64 PCM16 16kHz mono, useMock?: boolean }
// Streams newline-delimited JSON events: {type:"chunk",text,isFinal} ... {type:"done",text}
export async function POST(req: NextRequest) {
  let body: { pcm?: string; useMock?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body allowed → mock */
  }

  let pcm: Buffer;
  try {
    if (body.pcm && !body.useMock) {
      pcm = Buffer.from(body.pcm, "base64");
    } else {
      // Demo voice: stream the bundled sample through the real STT pipeline.
      pcm = await loadMockVoicePcm();
    }
  } catch {
    return Response.json({ error: "Invalid audio input." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      let finalText = "";
      try {
        send({ type: "status", mock: usingMockSTT });
        for await (const ev of transcribePcm(pcm)) {
          if (ev.isFinal) finalText = finalText ? `${finalText} ${ev.text}` : ev.text;
          send({ type: "chunk", text: ev.text, isFinal: ev.isFinal });
        }
        send({ type: "done", text: finalText.trim(), mock: usingMockSTT });
      } catch (err) {
        console.error("voice transcribe error:", err);
        send({
          type: "error",
          error: "Voice transcription failed. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
