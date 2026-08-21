export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const hasSupabaseBrowserConfig = Boolean(supabaseUrl && supabaseAnonKey);

export function assertSupabaseBrowserConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public environment variables are not configured.");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export const authConfirmRedirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://theinnerpause.app"}/auth/confirm`;
