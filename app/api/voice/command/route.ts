import { NextRequest, NextResponse } from "next/server";
import { parseVoiceCommand, usingMockAI, describeAiError } from "@/lib/gemini";
import { getStore } from "@/lib/store";
import { buildCommandResponse } from "@/lib/voice-command";

export const runtime = "nodejs";

// POST /api/voice/command  { transcript }
// Text path (BizCrush STT already produced the transcript) → Gemini parse.
export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "No transcript provided." },
        { status: 400 },
      );
    }

    const fridge = await getStore().list("have");
    const cmd = await parseVoiceCommand(
      transcript,
      fridge.map((f) => f.name),
    );
    return NextResponse.json(buildCommandResponse(cmd, fridge, usingMockAI));
  } catch (err) {
    console.error("voice command error:", err);
    return NextResponse.json(
      { error: `Could not understand that. ${describeAiError(err)}` },
      { status: 500 },
    );
  }
}
