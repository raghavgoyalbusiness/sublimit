import { DetectedSubscription, StatementAnalysis } from "./firewall-types";

export const demoSubscriptions: DetectedSubscription[] = [
  {
    id: "sub_netflix",
    merchantName: "Netflix",
    estimatedMonthlyCost: 649,
    estimatedYearlyCost: 7788,
    confidenceScore: 0.96,
    category: "Streaming",
    recommendation: "keep",
    reasoning: "Recurring monthly entertainment payment with steady usage signals.",
    lastSeenDate: "2026-05-08",
  },
  {
    id: "sub_spotify",
    merchantName: "Spotify",
    estimatedMonthlyCost: 119,
    estimatedYearlyCost: 1428,
    confidenceScore: 0.94,
    category: "Music",
    recommendation: "keep",
    reasoning: "Low cost, high-frequency recurring charge.",
    lastSeenDate: "2026-05-03",
  },
  {
    id: "sub_openai",
    merchantName: "ChatGPT Plus",
    estimatedMonthlyCost: 1999,
    estimatedYearlyCost: 23988,
    confidenceScore: 0.91,
    category: "AI tools",
    recommendation: "keep",
    reasoning: "Higher cost, but likely work/productivity related.",
    lastSeenDate: "2026-05-11",
  },
  {
    id: "sub_cloud",
    merchantName: "iCloud",
    estimatedMonthlyCost: 75,
    estimatedYearlyCost: 900,
    confidenceScore: 0.89,
    category: "Cloud storage",
    recommendation: "keep",
    reasoning: "Low-cost storage utility with low cancellation upside.",
    lastSeenDate: "2026-05-05",
  },
  {
    id: "sub_gym",
    merchantName: "FitLife Gym",
    estimatedMonthlyCost: 1800,
    estimatedYearlyCost: 21600,
    confidenceScore: 0.83,
    category: "Fitness",
    recommendation: "pause",
    reasoning: "Large recurring charge that should be reviewed if attendance is low.",
    lastSeenDate: "2026-05-01",
  },
  {
    id: "sub_food",
    merchantName: "FoodPass Gold",
    estimatedMonthlyCost: 299,
    estimatedYearlyCost: 3588,
    confidenceScore: 0.81,
    category: "Food delivery",
    recommendation: "cancel",
    reasoning: "Small but low-value membership that often hides inside delivery spend.",
    lastSeenDate: "2026-05-10",
  },
];

export const demoAnalysis: StatementAnalysis = {
  extractedText: `2026-05-01 FITLIFE GYM AUTO-DEBIT -1800
2026-05-03 SPOTIFY INDIA SUBSCRIPTION -119
2026-05-05 APPLE ICLOUD STORAGE -75
2026-05-08 NETFLIX.COM MONTHLY -649
2026-05-10 FOODPASS GOLD MEMBERSHIP -299
2026-05-11 OPENAI CHATGPT PLUS -1999`,
  modelUsed: "demo",
  source: "demo",
  summary:
    "Demo statement shows six recurring payments with a monthly subscription load of ₹4,941.",
  subscriptions: demoSubscriptions,
  transactions: [
    { date: "2026-05-01", description: "FITLIFE GYM AUTO-DEBIT", amount: 1800 },
    { date: "2026-05-03", description: "SPOTIFY INDIA SUBSCRIPTION", amount: 119 },
    { date: "2026-05-05", description: "APPLE ICLOUD STORAGE", amount: 75 },
    { date: "2026-05-08", description: "NETFLIX.COM MONTHLY", amount: 649 },
    { date: "2026-05-10", description: "FOODPASS GOLD MEMBERSHIP", amount: 299 },
    { date: "2026-05-11", description: "OPENAI CHATGPT PLUS", amount: 1999 },
  ],
};
