import { NextResponse } from "next/server";
import { demoAnalysis } from "@/lib/firewall-demo";
import {
  DetectedSubscription,
  StatementAnalysis,
  TransactionSignal,
} from "@/lib/firewall-types";
import { makeId } from "@/lib/firewall-utils";
import { callOpenAIJson, EXTRACTION_MODEL, hasOpenAIKey } from "@/lib/openai-server";
import { saveAnalysisSnapshot } from "@/lib/supabase-server";

export const runtime = "nodejs";

interface AiStatementResponse {
  extractedText: string;
  subscriptions: Array<Omit<DetectedSubscription, "id">>;
  transactions: TransactionSignal[];
  summary: string;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("statement");
    const useDemo = formData.get("demo") === "true";

    if (useDemo || !(file instanceof File)) {
      return NextResponse.json({
        analysis: demoAnalysis,
        saved: { saved: false, reason: "Demo data is local only." },
      });
    }

    if (!hasOpenAIKey()) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured. Add it to .env.local to analyze real uploads.",
          analysis: demoAnalysis,
        },
        { status: 400 },
      );
    }

    const filePayload = await fileToModelContent(file);
    const aiResult = await callOpenAIJson<AiStatementResponse>({
      input: [
        {
          role: "system",
          content:
            "You extract recurring payments from bank and card statements. Return strict JSON only. Estimate monthly and yearly subscription cost in INR when possible. Use confidenceScore from 0 to 1. recommendations must be one of keep, cancel, pause, negotiate.",
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Identify likely subscriptions and recurring payments in this statement. Include merchant name, category, monthly/yearly cost, confidence score, recommendation, reasoning, last seen date, transactions, and a short summary.",
            },
            filePayload,
          ],
        },
      ],
      maxOutputTokens: 1800,
      model: EXTRACTION_MODEL,
    });

    const analysis: StatementAnalysis = {
      extractedText: aiResult.extractedText,
      modelUsed: EXTRACTION_MODEL,
      source: "upload",
      subscriptions: aiResult.subscriptions.map((subscription) => ({
        ...subscription,
        id: makeId("sub"),
      })),
      summary: aiResult.summary,
      transactions: aiResult.transactions || [],
    };
    const saved = await saveAnalysisSnapshot(analysis);

    return NextResponse.json({ analysis, saved });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Statement analysis failed. Try the demo data or a smaller file.",
      },
      { status: 500 },
    );
  }
}

async function fileToModelContent(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = file.type || "application/octet-stream";

  if (
    mimeType.includes("csv") ||
    mimeType.includes("text") ||
    file.name.toLowerCase().endsWith(".csv")
  ) {
    return {
      type: "input_text",
      text: new TextDecoder().decode(arrayBuffer).slice(0, 120000),
    };
  }

  if (mimeType.startsWith("image/")) {
    return {
      type: "input_image",
      image_url: `data:${mimeType};base64,${base64}`,
    };
  }

  return {
    type: "input_file",
    filename: file.name,
    file_data: `data:${mimeType};base64,${base64}`,
  };
}
