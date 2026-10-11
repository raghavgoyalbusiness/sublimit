import { NextResponse } from "next/server";
import { CancellationResult, DetectedSubscription } from "@/lib/firewall-types";
import { ADVICE_MODEL, callOpenAIJson, hasOpenAIKey } from "@/lib/openai-server";

export const runtime = "nodejs";

interface Payload {
  subscription: DetectedSubscription;
  userName?: string;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;

    if (!payload.subscription) {
      return NextResponse.json(
        { error: "Choose a subscription first." },
        { status: 400 },
      );
    }

    if (!hasOpenAIKey()) {
      const fallback: CancellationResult = {
        emailBody: `Hello,\n\nPlease cancel my ${payload.subscription.merchantName} subscription effective immediately. Please confirm that auto-renewal has been disabled and that no future recurring charges will be made.\n\nThank you.`,
        emailSubject: `Cancel ${payload.subscription.merchantName} subscription`,
        merchantName: payload.subscription.merchantName,
        modelUsed: "local-fallback",
        retentionScript:
          "I understand there may be offers available, but I want to cancel auto-renewal today. Please confirm cancellation in writing.",
        steps: [
          "Sign in to the merchant account.",
          "Open Account, Billing, Membership, or Subscription settings.",
          "Choose cancel, pause, or disable auto-renewal.",
          "Check your card, UPI AutoPay, or mandate settings for active auto-debits.",
          "Save the confirmation email or screenshot.",
        ],
      };

      return NextResponse.json({ result: fallback });
    }

    const result = await callOpenAIJson<CancellationResult>({
      input: [
        {
          role: "system",
          content:
            "You write cancellation help for subscriptions. Return strict JSON only. Be direct and never claim the app cancels anything automatically.",
        },
        {
          role: "user",
          content: `Create cancellation help for ${payload.subscription.merchantName}. Category: ${payload.subscription.category}. Monthly cost: ${payload.subscription.estimatedMonthlyCost}. Include merchantName, emailSubject, emailBody, steps array, retentionScript, and modelUsed.`,
        },
      ],
      maxOutputTokens: 1100,
      model: ADVICE_MODEL,
    });

    return NextResponse.json({
      result: { ...result, modelUsed: ADVICE_MODEL },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Cancellation assistant failed.",
      },
      { status: 500 },
    );
  }
}
