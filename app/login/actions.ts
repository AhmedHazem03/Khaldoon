"use server";

import { createServerClient } from "@/lib/supabase-server";

export async function promoteToAdmin(
  userId: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createServerClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: { role: "admin" },
  });

  if (error) return { error: error.message };
  return { success: true };
}
