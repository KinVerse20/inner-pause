import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { assertSupabaseBrowserConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = assertSupabaseBrowserConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

