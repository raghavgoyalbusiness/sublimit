# Subscription Firewall AI

Subscription Firewall AI is a full-stack Next.js app that helps users detect, understand, limit, and cancel recurring subscriptions.

## What It Does

- Upload a CSV, PDF, or image statement
- Extract transaction text on the backend
- Use OpenAI to identify likely subscriptions and recurring payments
- Show merchant, estimated monthly/yearly cost, confidence score, category, and recommendation
- Calculate subscription burden as a percentage of monthly income
- Simulate whether a new subscription is affordable
- Generate cancellation emails and step-by-step cancellation instructions
- Work immediately with sample demo data
- Optionally save analysis snapshots to Supabase

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- OpenAI Responses API
- Supabase
- local demo data for zero-setup usage

## OpenAI Model Strategy

The app uses separate model defaults for cost control:

- `OPENAI_EXTRACTION_MODEL=gpt-5-nano` for statement extraction and classification
- `OPENAI_ADVICE_MODEL=gpt-5-mini` for affordability and cancellation guidance

Both can be changed in `.env.local`.

## Environment Setup

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

Then fill in:

```bash
OPENAI_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Supabase is optional for the demo experience. When configured, the backend attempts to insert analysis payloads into a `subscription_analyses` table with a `payload` JSON/JSONB column.

Example SQL:

```sql
create table if not exists subscription_analyses (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
```

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js, usually `http://localhost:3000`.

Production checks:

```bash
npm run lint
npm run build
```

## API Routes

- `POST /api/analyze-statement`
- `POST /api/affordability`
- `POST /api/cancellation`
- `GET /api/health`

## Current Limitations

- No real bank integrations
- No automatic cancellation of real subscriptions
- PDF and image extraction depends on OpenAI multimodal/file support and account access
- Supabase persistence is optional and schema-light
- No production auth or multi-user account system yet
- This is guidance only, not professional financial advice
