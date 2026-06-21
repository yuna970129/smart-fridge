import { NextResponse } from "next/server";
import { voiceProvider } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/voice/config — tells the client which voice engine to use.
export function GET() {
  return NextResponse.json({ provider: voiceProvider });
}
