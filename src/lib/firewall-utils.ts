import { BudgetInputs, DetectedSubscription } from "./firewall-types";

export const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currency.format(value);
}

export function totalMonthly(subscriptions: DetectedSubscription[]) {
  return subscriptions.reduce(
    (total, subscription) => total + subscription.estimatedMonthlyCost,
    0,
  );
}

export function totalYearly(subscriptions: DetectedSubscription[]) {
  return subscriptions.reduce(
    (total, subscription) => total + subscription.estimatedYearlyCost,
    0,
  );
}

export function burdenPercentage(
  subscriptions: DetectedSubscription[],
  budget: BudgetInputs,
) {
  if (budget.monthlyIncome <= 0) return 0;
  return (totalMonthly(subscriptions) / budget.monthlyIncome) * 100;
}

export function disposableIncome(budget: BudgetInputs) {
  return budget.monthlyIncome - budget.monthlyFixedExpenses;
}

export function recommendationTone(
  recommendation: DetectedSubscription["recommendation"],
) {
  if (recommendation === "keep") return "safe";
  if (recommendation === "cancel") return "danger";
  return "tight";
}

export function parseJsonObject<T>(text: string): T {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const raw = fenced?.[1] ?? text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("The AI response did not include a JSON object.");
  }

  return JSON.parse(raw.slice(start, end + 1)) as T;
}

export function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
