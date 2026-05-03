"use server";

import { createServerClient } from "@/lib/supabase-server";

/**
 * Promote a user to admin by setting app_metadata.role = 'admin'.
 * Uses service_role key. Run once from a trusted context (e.g. /api or server action).
 */
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

/**
 * Register a new user via the admin API — skips email confirmation entirely.
 * Uses service_role key (server-only). Returns the new user's ID on success.
 */
export async function registerUser(
  phone: string,
  password: string,
  name: string
): Promise<{ userId: string } | { error: string }> {
  const supabase = await createServerClient();
  const email = `${phone}@khaldoun.com`;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // auto-confirm — no email sent
    user_metadata: {
      phone_number: phone,
      name,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes("already registered") || error.message?.toLowerCase().includes("already been registered")) {
      return { error: "هذا الرقم مسجّل مسبقاً، حاول تسجيل الدخول" };
    }
    return { error: error.message ?? "حدث خطأ، حاول مرة أخرى" };
  }

  return { userId: data.user.id };
}

/**
 * Merge guest orders into a registered user account.
 * Matches by session token ONLY — never by phone number.
 * Uses SUPABASE_SERVICE_ROLE_KEY (server-only).
 *
 * NOTE: authId is the Supabase Auth UUID (auth.users.id).
 * orders.user_id references public.users.id — we must look it up first.
 */
export async function mergeGuestOrders(
  authId: string,
  guestToken: string
): Promise<void> {
  const supabase = await createServerClient();

  // Resolve the public user row (orders.user_id FK → public.users.id, not auth.users.id)
  const { data: rawPublicUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authId)
    .single();

  const publicUser = rawPublicUser as { id: string } | null;
  if (!publicUser) return;

  await (supabase as any)
    .from("orders")
    .update({ user_id: publicUser.id })
    .eq("guest_token", guestToken)
    .is("user_id", null);
}
