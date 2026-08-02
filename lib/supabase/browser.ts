"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseBrowserConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = assertSupabaseBrowserConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

