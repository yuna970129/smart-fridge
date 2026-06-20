import { NextRequest, NextResponse } from "next/server";
import { analyzeReceipt, usingMockAI } from "@/lib/gemini";
import { parseDataUrl } from "@/lib/image";

export const runtime = "nodejs";

// POST /api/scan-receipt — recognize food items from a receipt photo.
// Does NOT save; the client saves via POST /api/fridge on "Confirm & Save".
export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }
    const { base64, mimeType } = parseDataUrl(image);
    const items = await analyzeReceipt(base64, mimeType);
    return NextResponse.json({ items, mock: usingMockAI });
  } catch (err) {
    console.error("scan-receipt error:", err);
    return NextResponse.json(
      { error: "Could not read the receipt. Please try another photo." },
      { status: 500 },
    );
  }
}
