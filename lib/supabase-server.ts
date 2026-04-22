import {
  createServerClient as createSupabaseServerClient,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

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
