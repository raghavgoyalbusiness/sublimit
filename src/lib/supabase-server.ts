import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}

export async function saveAnalysisSnapshot(payload: unknown) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return { saved: false, reason: "Supabase env vars are not configured." };
  }

  const { error } = await supabase.from("subscription_analyses").insert({
    payload,
  });

  if (error) {
    return { saved: false, reason: error.message };
  }

  return { saved: true };
}
