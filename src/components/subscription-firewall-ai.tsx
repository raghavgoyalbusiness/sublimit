"use client";

import {
  AlertCircle,
  ArrowRight,
  Ban,
  BarChart3,
  FileUp,
  Loader2,
  Mail,
  PieChart,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Upload,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { type ChangeEvent, type ReactNode, useMemo, useState } from "react";
import { demoAnalysis } from "@/lib/firewall-demo";
import {
  AffordabilityResult,
  BudgetInputs,
  CancellationResult,
  DetectedSubscription,
  StatementAnalysis,
} from "@/lib/firewall-types";
import {
  burdenPercentage,
  disposableIncome,
  formatCurrency,
  recommendationTone,
  totalMonthly,
  totalYearly,
} from "@/lib/firewall-utils";

type PageId =
  | "landing"
  | "dashboard"
  | "upload"
  | "analysis"
  | "simulator"
  | "cancellation";

interface ApiState {
  loading: boolean;
  error: string;
}

const navItems: Array<{ id: PageId; label: string; icon: LucideIcon }> = [
  { id: "landing", label: "Landing", icon: ShieldCheck },
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "upload", label: "Upload", icon: FileUp },
  { id: "analysis", label: "Analysis", icon: ReceiptText },
  { id: "simulator", label: "Simulator", icon: WalletCards },
  { id: "cancellation", label: "Cancel", icon: Ban },
];

const initialBudget: BudgetInputs = {
  monthlyFixedExpenses: 82000,
  monthlyIncome: 150000,
};

export function SubscriptionFirewallAI() {
  const [activePage, setActivePage] = useState<PageId>("landing");
  const [analysis, setAnalysis] = useState<StatementAnalysis>(demoAnalysis);
  const [budget, setBudget] = useState<BudgetInputs>(initialBudget);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<ApiState>({
    error: "",
    loading: false,
  });
  const [newSubscriptionName, setNewSubscriptionName] = useState("Design tool Pro");
  const [newSubscriptionPrice, setNewSubscriptionPrice] = useState(1299);
  const [affordability, setAffordability] =
    useState<AffordabilityResult | null>(null);
  const [simulatorState, setSimulatorState] = useState<ApiState>({
    error: "",
    loading: false,
  });
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    analysis.subscriptions[0]?.id || "",
  );
  const [cancellation, setCancellation] =
    useState<CancellationResult | null>(null);
  const [cancellationState, setCancellationState] = useState<ApiState>({
    error: "",
    loading: false,
  });

  const subscriptions = analysis.subscriptions;
  const monthlyTotal = totalMonthly(subscriptions);
  const yearlyTotal = totalYearly(subscriptions);
  const burden = burdenPercentage(subscriptions, budget);
  const disposable = disposableIncome(budget);
  const selectedSubscription =
    subscriptions.find((subscription) => subscription.id === selectedSubscriptionId) ||
    subscriptions[0];
  const savingsCandidates = subscriptions
    .filter((subscription) => subscription.recommendation !== "keep")
    .sort((a, b) => b.estimatedYearlyCost - a.estimatedYearlyCost);
  const potentialSavings = savingsCandidates
    .slice(0, 3)
    .reduce((total, subscription) => total + subscription.estimatedYearlyCost, 0);

  async function analyzeDemoData() {
    setUploadState({ error: "", loading: true });
    try {
      const formData = new FormData();
      formData.append("demo", "true");
      const response = await fetch("/api/analyze-statement", {
        body: formData,
        method: "POST",
      });
      const data = (await response.json()) as {
        analysis?: StatementAnalysis;
        error?: string;
      };

      if (!response.ok || !data.analysis) {
        throw new Error(data.error || "Demo analysis failed.");
      }

      setAnalysis(data.analysis);
      setSelectedSubscriptionId(data.analysis.subscriptions[0]?.id || "");
      setActivePage("analysis");
    } catch (error) {
      setUploadState({
        error: error instanceof Error ? error.message : "Demo analysis failed.",
        loading: false,
      });
      return;
    }
    setUploadState({ error: "", loading: false });
  }

  async function analyzeUpload() {
    if (!selectedFile) {
      setUploadState({ error: "Choose a CSV, PDF, or image first.", loading: false });
      return;
    }

    setUploadState({ error: "", loading: true });
    try {
      const formData = new FormData();
      formData.append("statement", selectedFile);
      const response = await fetch("/api/analyze-statement", {
        body: formData,
        method: "POST",
      });
      const data = (await response.json()) as {
        analysis?: StatementAnalysis;
        error?: string;
      };

      if (!response.ok || !data.analysis) {
        throw new Error(data.error || "Statement analysis failed.");
      }

      setAnalysis(data.analysis);
      setSelectedSubscriptionId(data.analysis.subscriptions[0]?.id || "");
      setActivePage("analysis");
    } catch (error) {
      setUploadState({
        error:
          error instanceof Error
            ? error.message
            : "Statement analysis failed. Try demo mode.",
        loading: false,
      });
      return;
    }
    setUploadState({ error: "", loading: false });
  }

  async function runSimulator() {
    setSimulatorState({ error: "", loading: true });
    try {
      const response = await fetch("/api/affordability", {
        body: JSON.stringify({
          budget,
          newSubscriptionName,
          newSubscriptionPrice,
          subscriptions,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        result?: AffordabilityResult;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error || "Simulator failed.");
      }

      setAffordability(data.result);
    } catch (error) {
      setSimulatorState({
        error: error instanceof Error ? error.message : "Simulator failed.",
        loading: false,
      });
      return;
    }
    setSimulatorState({ error: "", loading: false });
  }

  async function generateCancellationHelp() {
    if (!selectedSubscription) return;

    setCancellationState({ error: "", loading: true });
    try {
      const response = await fetch("/api/cancellation", {
        body: JSON.stringify({ subscription: selectedSubscription }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = (await response.json()) as {
        error?: string;
        result?: CancellationResult;
      };

      if (!response.ok || !data.result) {
        throw new Error(data.error || "Cancellation assistant failed.");
      }

      setCancellation(data.result);
    } catch (error) {
      setCancellationState({
        error:
          error instanceof Error ? error.message : "Cancellation assistant failed.",
        loading: false,
      });
      return;
    }
    setCancellationState({ error: "", loading: false });
  }

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-zinc-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row">
        <aside className="sticky top-0 z-30 border-b border-zinc-200 bg-[#f7f7f4]/95 px-4 py-3 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <button
            className="flex items-center gap-3 text-left"
            onClick={() => setActivePage("landing")}
            type="button"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">
                Subscription Firewall AI
              </span>
              <span className="block text-xs leading-5 text-zinc-500">
                Detect, limit, and cancel recurring spend.
              </span>
            </span>
          </button>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:mt-8 lg:grid lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activePage;

              return (
                <button
                  className={classNames(
                    "flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                    active
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-white hover:text-zinc-950",
                  )}
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  type="button"
                >
                  <Icon className="size-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:block">
            <p className="text-sm font-semibold">Current burden</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {burden.toFixed(1)}%
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {formatCurrency(monthlyTotal)} per month across{" "}
              {subscriptions.length} likely subscriptions.
            </p>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {activePage === "landing" && (
            <LandingPage
              onDemo={analyzeDemoData}
              onStart={() => setActivePage("upload")}
              loading={uploadState.loading}
            />
          )}

          {activePage === "dashboard" && (
            <DashboardPage
              burden={burden}
              disposable={disposable}
              monthlyTotal={monthlyTotal}
              onAnalyze={() => setActivePage("analysis")}
              onCancel={() => setActivePage("cancellation")}
              onSimulate={() => setActivePage("simulator")}
              potentialSavings={potentialSavings}
              subscriptions={subscriptions}
              yearlyTotal={yearlyTotal}
            />
          )}

          {activePage === "upload" && (
            <UploadPage
              error={uploadState.error}
              loading={uploadState.loading}
              onDemo={analyzeDemoData}
              onFileChange={(event) => {
                const file = event.target.files?.[0] || null;
                setSelectedFile(file);
                setUploadState({ error: "", loading: false });
              }}
              onUpload={analyzeUpload}
              selectedFile={selectedFile}
            />
          )}

          {activePage === "analysis" && (
            <AnalysisPage
              analysis={analysis}
              budget={budget}
              burden={burden}
              monthlyTotal={monthlyTotal}
              onBudgetChange={setBudget}
              onCancel={(id) => {
                setSelectedSubscriptionId(id);
                setActivePage("cancellation");
              }}
              yearlyTotal={yearlyTotal}
            />
          )}

          {activePage === "simulator" && (
            <SimulatorPage
              budget={budget}
              error={simulatorState.error}
              loading={simulatorState.loading}
              monthlyTotal={monthlyTotal}
              newSubscriptionName={newSubscriptionName}
              newSubscriptionPrice={newSubscriptionPrice}
              onBudgetChange={setBudget}
              onNameChange={setNewSubscriptionName}
              onPriceChange={setNewSubscriptionPrice}
              onRun={runSimulator}
              result={affordability}
            />
          )}

          {activePage === "cancellation" && (
            <CancellationPage
              error={cancellationState.error}
              loading={cancellationState.loading}
              onGenerate={generateCancellationHelp}
              onSelect={setSelectedSubscriptionId}
              result={cancellation}
              selectedSubscription={selectedSubscription}
              selectedSubscriptionId={selectedSubscriptionId}
              subscriptions={subscriptions}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function LandingPage({
  loading,
  onDemo,
  onStart,
}: {
  loading: boolean;
  onDemo: () => void;
  onStart: () => void;
}) {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-zinc-950 px-6 py-10 text-white shadow-xl shadow-zinc-900/10 sm:px-8 lg:px-12 lg:py-14">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-zinc-200">
            <Sparkles className="size-4" />
            AI-powered subscription detection
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">
            Find the recurring charges hiding in your statements.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
            Upload a statement, detect likely subscriptions, understand income
            burden, simulate new plans, and generate cancellation help without
            pretending to touch your bank account.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onStart} variant="light">
              Upload statement
              <ArrowRight className="size-4" />
            </Button>
            <Button onClick={onDemo} variant="darkOutline">
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Try sample data
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Upload}
          title="Extract statement text"
          copy="CSV, PDF, and image uploads are handled by the backend, with demo mode available instantly."
        />
        <FeatureCard
          icon={ShieldCheck}
          title="Classify recurring spend"
          copy="A cheaper extraction model identifies likely subscriptions and confidence levels."
        />
        <FeatureCard
          icon={Mail}
          title="Cancel with help"
          copy="A stronger model drafts cancellation emails and practical step-by-step instructions."
        />
      </section>
    </div>
  );
}

function DashboardPage({
  burden,
  disposable,
  monthlyTotal,
  onAnalyze,
  onCancel,
  onSimulate,
  potentialSavings,
  subscriptions,
  yearlyTotal,
}: {
  burden: number;
  disposable: number;
  monthlyTotal: number;
  onAnalyze: () => void;
  onCancel: () => void;
  onSimulate: () => void;
  potentialSavings: number;
  subscriptions: DetectedSubscription[];
  yearlyTotal: number;
}) {
  const topSubscriptions = useMemo(
    () =>
      [...subscriptions]
        .sort((a, b) => b.estimatedMonthlyCost - a.estimatedMonthlyCost)
        .slice(0, 4),
    [subscriptions],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Dashboard"
        title="Your subscription firewall"
        copy="A clean view of detected recurring charges and how much pressure they put on your income."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ReceiptText} label="Monthly subscriptions" value={formatCurrency(monthlyTotal)} />
        <MetricCard icon={PieChart} label="Yearly impact" value={formatCurrency(yearlyTotal)} />
        <MetricCard icon={BarChart3} label="Income burden" value={`${burden.toFixed(1)}%`} tone={burden > 8 ? "danger" : burden > 5 ? "tight" : "safe"} />
        <MetricCard icon={WalletCards} label="Disposable income" value={formatCurrency(disposable)} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <Panel title="Detected subscriptions" icon={ReceiptText}>
          <div className="space-y-3">
            {topSubscriptions.map((subscription) => (
              <SubscriptionRow key={subscription.id} subscription={subscription} />
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={onAnalyze}>View full analysis</Button>
            <Button onClick={onSimulate} variant="secondary">
              Can I afford this?
            </Button>
          </div>
        </Panel>

        <Panel title="Firewall recommendation" icon={ShieldCheck}>
          <div className="rounded-3xl bg-zinc-950 p-5 text-white">
            <p className="text-sm text-zinc-400">Potential annual savings</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {formatCurrency(potentialSavings)}
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              Cancel, pause, or negotiate the top low-value subscriptions before
              adding anything new.
            </p>
          </div>
          <Button className="mt-4 w-full" onClick={onCancel}>
            Open cancellation assistant
          </Button>
        </Panel>
      </section>
    </div>
  );
}

function UploadPage({
  error,
  loading,
  onDemo,
  onFileChange,
  onUpload,
  selectedFile,
}: {
  error: string;
  loading: boolean;
  onDemo: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  selectedFile: File | null;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Upload statement"
        title="Extract recurring payments"
        copy="Upload a CSV, PDF, or image of a bank or card statement. For real uploads, the backend sends only the file content needed for extraction."
      />

      <Panel title="Statement upload" icon={FileUp}>
        <label className="flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center transition hover:bg-white">
          <Upload className="size-10 text-zinc-500" />
          <span className="mt-4 text-lg font-semibold">
            {selectedFile ? selectedFile.name : "Drop in a statement file"}
          </span>
          <span className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            CSV is fastest. PDF and image files use AI extraction. Demo mode is
            available when you do not want to upload anything.
          </span>
          <input
            accept=".csv,.pdf,image/*,text/csv"
            className="sr-only"
            onChange={onFileChange}
            type="file"
          />
        </label>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={loading} onClick={onUpload}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Analyze upload
          </Button>
          <Button disabled={loading} onClick={onDemo} variant="secondary">
            Use sample demo data
          </Button>
        </div>
        {error ? <ErrorMessage message={error} /> : null}
      </Panel>
    </div>
  );
}

function AnalysisPage({
  analysis,
  budget,
  burden,
  monthlyTotal,
  onBudgetChange,
  onCancel,
  yearlyTotal,
}: {
  analysis: StatementAnalysis;
  budget: BudgetInputs;
  burden: number;
  monthlyTotal: number;
  onBudgetChange: (budget: BudgetInputs) => void;
  onCancel: (id: string) => void;
  yearlyTotal: number;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Subscription analysis"
        title="Likely recurring payments"
        copy={analysis.summary || "Review the detected subscriptions and recommendations."}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard icon={ReceiptText} label="Monthly total" value={formatCurrency(monthlyTotal)} />
        <MetricCard icon={PieChart} label="Yearly total" value={formatCurrency(yearlyTotal)} />
        <MetricCard icon={ShieldCheck} label="Model used" value={analysis.modelUsed} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Panel title="Detected subscriptions" icon={ReceiptText}>
          <div className="space-y-3">
            {analysis.subscriptions.length > 0 ? (
              analysis.subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  onCancel={() => onCancel(subscription.id)}
                  subscription={subscription}
                />
              ))
            ) : (
              <EmptyState text="No likely subscriptions were detected yet. Upload a richer statement or use the demo data." />
            )}
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Income settings" icon={WalletCards}>
            <BudgetFields budget={budget} onChange={onBudgetChange} />
            <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
              Subscription burden is{" "}
              <span className="font-semibold text-zinc-950">
                {burden.toFixed(1)}%
              </span>{" "}
              of monthly income.
            </div>
          </Panel>

          <Panel title="Extracted text preview" icon={FileUp}>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
              {analysis.extractedText || "No extracted text available."}
            </pre>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function SimulatorPage({
  budget,
  error,
  loading,
  monthlyTotal,
  newSubscriptionName,
  newSubscriptionPrice,
  onBudgetChange,
  onNameChange,
  onPriceChange,
  onRun,
  result,
}: {
  budget: BudgetInputs;
  error: string;
  loading: boolean;
  monthlyTotal: number;
  newSubscriptionName: string;
  newSubscriptionPrice: number;
  onBudgetChange: (budget: BudgetInputs) => void;
  onNameChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onRun: () => void;
  result: AffordabilityResult | null;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Can I afford this?"
        title="Simulate a new subscription"
        copy="Enter a new plan and let the app compare it with your current subscription burden."
      />

      <section className="grid gap-5 xl:grid-cols-[0.85fr_1fr]">
        <Panel title="New subscription" icon={WalletCards}>
          <div className="grid gap-4">
            <TextField label="Subscription name" onChange={onNameChange} value={newSubscriptionName} />
            <NumberField label="Monthly price" onChange={onPriceChange} value={newSubscriptionPrice} />
            <BudgetFields budget={budget} onChange={onBudgetChange} />
          </div>
          <Button className="mt-5 w-full" disabled={loading} onClick={onRun}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            Generate verdict
          </Button>
          {error ? <ErrorMessage message={error} /> : null}
        </Panel>

        <Panel title="Affordability verdict" icon={ShieldCheck}>
          {result ? (
            <div className="space-y-4">
              <div className={classNames("rounded-3xl border p-5", result.verdict === "Approved" && "border-emerald-200 bg-emerald-50", result.verdict === "Tight" && "border-amber-200 bg-amber-50", result.verdict === "Not recommended" && "border-rose-200 bg-rose-50")}>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Verdict
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                  {result.verdict}
                </h2>
                <p className="mt-3 leading-7 text-zinc-700">{result.reasoning}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Fact label="Current total" value={formatCurrency(monthlyTotal)} />
                <Fact label="New total" value={formatCurrency(result.newMonthlyTotal)} />
                <Fact label="New burden" value={`${result.newBurdenPercentage.toFixed(1)}%`} />
              </div>
              <div className="space-y-2">
                {result.suggestions.map((suggestion) => (
                  <p className="rounded-2xl bg-zinc-50 p-3 text-sm text-zinc-700" key={suggestion}>
                    {suggestion}
                  </p>
                ))}
              </div>
              <p className="text-xs text-zinc-500">Model: {result.modelUsed}</p>
            </div>
          ) : (
            <EmptyState text="Run the simulator to get a verdict, reasoning, and suggested tradeoffs." />
          )}
        </Panel>
      </section>
    </div>
  );
}

function CancellationPage({
  error,
  loading,
  onGenerate,
  onSelect,
  result,
  selectedSubscription,
  selectedSubscriptionId,
  subscriptions,
}: {
  error: string;
  loading: boolean;
  onGenerate: () => void;
  onSelect: (id: string) => void;
  result: CancellationResult | null;
  selectedSubscription?: DetectedSubscription;
  selectedSubscriptionId: string;
  subscriptions: DetectedSubscription[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Cancellation assistant"
        title="Generate cancellation help"
        copy="The app drafts emails and steps only. It never cancels a subscription automatically."
      />

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1fr]">
        <Panel title="Choose subscription" icon={Ban}>
          <label className="text-sm font-medium text-zinc-700">
            Subscription
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5"
              onChange={(event) => onSelect(event.target.value)}
              value={selectedSubscriptionId}
            >
              {subscriptions.map((subscription) => (
                <option key={subscription.id} value={subscription.id}>
                  {subscription.merchantName}
                </option>
              ))}
            </select>
          </label>
          {selectedSubscription ? (
            <div className="mt-4 rounded-3xl bg-zinc-50 p-4">
              <p className="font-semibold">{selectedSubscription.merchantName}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {formatCurrency(selectedSubscription.estimatedMonthlyCost)}/month ·{" "}
                {selectedSubscription.recommendation}
              </p>
            </div>
          ) : null}
          <Button className="mt-5 w-full" disabled={loading || !selectedSubscription} onClick={onGenerate}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            Write cancellation email
          </Button>
          {error ? <ErrorMessage message={error} /> : null}
        </Panel>

        <Panel title="Cancellation output" icon={Mail}>
          {result ? (
            <div className="space-y-4">
              <Fact label="Subject" value={result.emailSubject} />
              <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  Email body
                </p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-800">
                  {result.emailBody}
                </pre>
              </div>
              <div className="rounded-2xl bg-zinc-50 p-4">
                <p className="font-semibold">Steps</p>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-zinc-700">
                  {result.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <Fact label="Retention script" value={result.retentionScript} />
              <p className="text-xs text-zinc-500">Model: {result.modelUsed}</p>
            </div>
          ) : (
            <EmptyState text="Choose a subscription and generate cancellation steps." />
          )}
        </Panel>
      </section>
    </div>
  );
}

function SubscriptionCard({
  onCancel,
  subscription,
}: {
  onCancel: () => void;
  subscription: DetectedSubscription;
}) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{subscription.merchantName}</h3>
            <Tag tone={recommendationTone(subscription.recommendation)}>
              {subscription.recommendation}
            </Tag>
            <Tag>{subscription.category}</Tag>
          </div>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {subscription.reasoning}
          </p>
        </div>
        <Button onClick={onCancel} variant="secondary">
          Cancellation help
        </Button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <Fact label="Monthly" value={formatCurrency(subscription.estimatedMonthlyCost)} />
        <Fact label="Yearly" value={formatCurrency(subscription.estimatedYearlyCost)} />
        <Fact label="Confidence" value={`${Math.round(subscription.confidenceScore * 100)}%`} />
        <Fact label="Last seen" value={subscription.lastSeenDate || "Unknown"} />
      </div>
    </article>
  );
}

function SubscriptionRow({ subscription }: { subscription: DetectedSubscription }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
      <div>
        <p className="font-medium">{subscription.merchantName}</p>
        <p className="text-sm text-zinc-500">
          {subscription.category} · {subscription.recommendation}
        </p>
      </div>
      <p className="text-right font-semibold">
        {formatCurrency(subscription.estimatedMonthlyCost)}
        <span className="block text-xs font-medium text-zinc-500">/month</span>
      </p>
    </div>
  );
}

function BudgetFields({
  budget,
  onChange,
}: {
  budget: BudgetInputs;
  onChange: (budget: BudgetInputs) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <NumberField
        label="Monthly income"
        onChange={(value) => onChange({ ...budget, monthlyIncome: value })}
        value={budget.monthlyIncome}
      />
      <NumberField
        label="Monthly fixed expenses"
        onChange={(value) => onChange({ ...budget, monthlyFixedExpenses: value })}
        value={budget.monthlyFixedExpenses}
      />
    </div>
  );
}

function PageHeader({
  copy,
  kicker,
  title,
}: {
  copy: string;
  kicker: string;
  title: string;
}) {
  return (
    <header>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {kicker}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{copy}</p>
    </header>
  );
}

function FeatureCard({
  copy,
  icon: Icon,
  title,
}: {
  copy: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800">
        <Icon className="size-5" />
      </span>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
    </article>
  );
}

function MetricCard({
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "neutral" | "safe" | "tight" | "danger";
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">{label}</p>
        <span
          className={classNames(
            "flex size-10 items-center justify-center rounded-2xl",
            tone === "neutral" && "bg-zinc-100 text-zinc-700",
            tone === "safe" && "bg-emerald-50 text-emerald-700",
            tone === "tight" && "bg-amber-50 text-amber-700",
            tone === "danger" && "bg-rose-50 text-rose-700",
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-4 break-words text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800">
          <Icon className="size-4" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function Button({
  children,
  className,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "light" | "darkOutline";
}) {
  return (
    <button
      className={classNames(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-zinc-950/10 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "secondary" &&
          "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
        variant === "light" && "bg-white text-zinc-950 hover:bg-zinc-100",
        variant === "darkOutline" &&
          "border border-white/15 bg-white/5 text-white hover:bg-white/10",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function TextField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm font-medium text-zinc-700">
      {label}
      <input
        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="text-sm font-medium text-zinc-700">
      {label}
      <input
        className="mt-2 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5"
        min="0"
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={Number.isFinite(value) ? value : 0}
      />
    </label>
  );
}

function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "safe" | "tight" | "danger";
}) {
  return (
    <span
      className={classNames(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "neutral" && "bg-zinc-100 text-zinc-600",
        tone === "safe" && "bg-emerald-50 text-emerald-700",
        tone === "tight" && "bg-amber-50 text-amber-700",
        tone === "danger" && "bg-rose-50 text-rose-700",
      )}
    >
      {children}
    </span>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-500">
      {text}
    </div>
  );
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
