import { NextRequest, NextResponse } from "next/server";
import {
  parseVoiceCommandFromAudio,
  usingMockAI,
  describeAiError,
} from "@/lib/gemini";
import { getStore } from "@/lib/store";
import { buildCommandResponse } from "@/lib/voice-command";
import { loadMockVoiceWav } from "@/lib/bizcrush";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/voice/command-audio  { audio?: base64 WAV, mimeType?, useMock? }
// Gemini-only path: ONE multimodal call transcribes + parses the audio.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let base64: string;
    let mimeType = "audio/wav";

    if (body.audio && !body.useMock) {
      base64 = String(body.audio);
      if (typeof body.mimeType === "string") mimeType = body.mimeType;
    } else {
      // Demo voice: the bundled sample, wrapped as WAV.
      base64 = (await loadMockVoiceWav()).toString("base64");
    }

    const fridge = await getStore().list("have");
    const cmd = await parseVoiceCommandFromAudio(
      base64,
      mimeType,
      fridge.map((f) => f.name),
    );
    return NextResponse.json(buildCommandResponse(cmd, fridge, usingMockAI));
  } catch (err) {
    console.error("voice command-audio error:", err);
    return NextResponse.json(
      { error: `Could not understand that. ${describeAiError(err)}` },
      { status: 500 },
    );
  }
}
