export type SubscriptionRecommendation = "keep" | "cancel" | "pause" | "negotiate";

export type SubscriptionCategory =
  | "Streaming"
  | "Music"
  | "Software"
  | "AI tools"
  | "Cloud storage"
  | "Fitness"
  | "Food delivery"
  | "Telecom"
  | "Insurance"
  | "Finance"
  | "Other";

export interface DetectedSubscription {
  id: string;
  merchantName: string;
  estimatedMonthlyCost: number;
  estimatedYearlyCost: number;
  confidenceScore: number;
  category: SubscriptionCategory;
  recommendation: SubscriptionRecommendation;
  reasoning: string;
  lastSeenDate?: string;
}

export interface TransactionSignal {
  date: string;
  description: string;
  amount: number;
}

export interface StatementAnalysis {
  extractedText: string;
  subscriptions: DetectedSubscription[];
  transactions: TransactionSignal[];
  summary: string;
  modelUsed: string;
  source: "demo" | "upload";
}

export interface BudgetInputs {
  monthlyIncome: number;
  monthlyFixedExpenses: number;
}

export interface AffordabilityResult {
  verdict: "Approved" | "Tight" | "Not recommended";
  burdenPercentage: number;
  newBurdenPercentage: number;
  newMonthlyTotal: number;
  reasoning: string;
  suggestions: string[];
  modelUsed: string;
}

export interface CancellationResult {
  merchantName: string;
  emailSubject: string;
  emailBody: string;
  steps: string[];
  retentionScript: string;
  modelUsed: string;
}
