import {
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Anon-key, cookie-less client for reading PUBLIC tables from Server
 * Components (homepage, /menu, etc.). Use this in preference to
 * createServerClient() when no auth or mutations are needed — it keeps
 * service-role usage scoped to writes and RLS-bypassing reads.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * Session-aware server client — uses anon key + cookies to read auth state.
 * Use this to call supabase.auth.getUser() in Server Actions and Route Handlers.
 * NEVER import this in client components.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // safe to ignore in read-only contexts
          }
        },
      },
    }
  );
}

/**
 * Server client — uses service role key for Server Actions and Route Handlers only.
 * NEVER import this in client components.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll may fail in read-only Server Component contexts — safe to ignore
          }
        },
      },
    }
  );
}

/**
 * Verifies the caller is an admin (app_metadata.role === 'admin').
 * Throws a Response-like Error that Next.js Server Actions can surface.
 * Call at the top of every mutating admin Server Action.
 */
export async function requireAdmin(): Promise<void> {
  const client = await createSessionClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    // Logged so the real reason is visible in the Vercel function logs
    // (the client only sees an opaque 500 + digest in production).
    console.error("[requireAdmin] denied", {
      hasUser: !!user,
      role: user?.app_metadata?.role ?? null,
      authError: error?.message ?? null,
    });
    throw new Error("غير مصرح");
  }
}
