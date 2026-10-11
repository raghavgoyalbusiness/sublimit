import { NextResponse } from "next/server";
import {
  AffordabilityResult,
  BudgetInputs,
  DetectedSubscription,
} from "@/lib/firewall-types";
import { burdenPercentage, totalMonthly } from "@/lib/firewall-utils";
import { ADVICE_MODEL, callOpenAIJson, hasOpenAIKey } from "@/lib/openai-server";

export const runtime = "nodejs";

interface Payload {
  budget: BudgetInputs;
  newSubscriptionName: string;
  newSubscriptionPrice: number;
  subscriptions: DetectedSubscription[];
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    const currentMonthlyTotal = totalMonthly(payload.subscriptions || []);
    const newMonthlyTotal = currentMonthlyTotal + Number(payload.newSubscriptionPrice || 0);
    const currentBurden = burdenPercentage(payload.subscriptions || [], payload.budget);
    const newBurdenPercentage =
      payload.budget.monthlyIncome > 0
        ? (newMonthlyTotal / payload.budget.monthlyIncome) * 100
        : 0;

    if (!hasOpenAIKey()) {
      const fallback: AffordabilityResult = {
        burdenPercentage: currentBurden,
        modelUsed: "local-fallback",
        newBurdenPercentage,
        newMonthlyTotal,
        reasoning:
          newBurdenPercentage <= 5
            ? "This looks affordable based on your income."
            : newBurdenPercentage <= 8
              ? "This is possible, but it pushes your subscription load into a tighter range."
              : "This is not recommended unless it directly helps you earn money or save serious time.",
        suggestions:
          newBurdenPercentage > 8
            ? [
                "Cancel or pause one low-value subscription first.",
                "Try the free plan or one-month trial before committing.",
                "Set a reminder to review it before renewal.",
              ]
            : [
                "Set a renewal reminder.",
                "Review the subscription after the first billing cycle.",
              ],
        verdict:
          newBurdenPercentage <= 5
            ? "Approved"
            : newBurdenPercentage <= 8
              ? "Tight"
              : "Not recommended",
      };

      return NextResponse.json({ result: fallback });
    }

    const result = await callOpenAIJson<AffordabilityResult>({
      input: [
        {
          role: "system",
          content:
            "You are a cautious personal finance assistant. Return strict JSON only. Do not claim to provide professional financial advice.",
        },
        {
          role: "user",
          content: `Current monthly subscription total: ${currentMonthlyTotal}. Monthly income: ${payload.budget.monthlyIncome}. Fixed expenses: ${payload.budget.monthlyFixedExpenses}. Current burden: ${currentBurden.toFixed(2)}%. New subscription: ${payload.newSubscriptionName}, monthly price ${payload.newSubscriptionPrice}. Return verdict, burdenPercentage, newBurdenPercentage, newMonthlyTotal, reasoning, suggestions array, and modelUsed.`,
        },
      ],
      maxOutputTokens: 900,
      model: ADVICE_MODEL,
    });

    return NextResponse.json({
      result: {
        ...result,
        burdenPercentage: currentBurden,
        modelUsed: ADVICE_MODEL,
        newBurdenPercentage,
        newMonthlyTotal,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Affordability simulation failed.",
      },
      { status: 500 },
    );
  }
}
