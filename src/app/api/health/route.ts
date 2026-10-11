import { NextResponse } from "next/server";
import { ADVICE_MODEL, EXTRACTION_MODEL, hasOpenAIKey } from "@/lib/openai-server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export function GET() {
  return NextResponse.json({
    adviceModel: ADVICE_MODEL,
    extractionModel: EXTRACTION_MODEL,
    openaiConfigured: hasOpenAIKey(),
    supabaseConfigured: Boolean(getSupabaseAdmin()),
  });
}
