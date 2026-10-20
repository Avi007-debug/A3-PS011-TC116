import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ||
  (typeof window !== "undefined" ? localStorage.getItem("argus_supabase_url") : null) ||
  "";

const supabaseAnonKey =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ||
  (typeof window !== "undefined" ? localStorage.getItem("argus_supabase_anon_key") : null) ||
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function saveAssessmentReport(reportData: {
  snapshot_id?: string;
  snapshot_label?: string;
  total_assets?: number;
  hygiene_score?: number;
  posture_score?: number;
  drift_detected?: boolean;
  drift_count?: number;
  merkle_root: string;
}) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("baseline_snapshots")
      .insert([reportData])
      .select();

    if (error) {
      console.warn("[Supabase] Insert snapshot warning:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("[Supabase] Failed to sync snapshot:", err);
    return null;
  }
}

export async function fetchRecentReports() {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("baseline_snapshots")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      // Fallback try assessment_reports if legacy table exists
      const { data: legacyData } = await supabase
        .from("assessment_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return legacyData || [];
    }
    return data || [];
  } catch {
    return [];
  }
}
