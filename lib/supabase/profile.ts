import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function upsertProfileRow(input: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("profiles").upsert(
    {
      id: input.userId,
      email: input.email,
      full_name: input.fullName ?? "",
      phone: input.phone ?? "",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

