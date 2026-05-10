import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Merge guest orders if guest_token cookie was stored before OAuth redirect
  const guestToken = request.cookies.get("guest_token")?.value;
  if (guestToken) {
    try {
      const serverClient = await createServerClient();
      const { data: publicUser } = await serverClient
        .from("users")
        .select("id")
        .eq("auth_id", data.user.id)
        .single();

      if (publicUser) {
        await serverClient
          .from("orders")
          .update({ user_id: publicUser.id })
          .eq("guest_token", decodeURIComponent(guestToken))
          .is("user_id", null);
      }
    } catch {
      // merge failure is non-critical
    }
  }

  const redirectPath = data.user.app_metadata?.role === "admin" ? "/admin" : "/profile";
  const response = NextResponse.redirect(`${origin}${redirectPath}`);

  if (guestToken) {
    response.cookies.delete("guest_token");
  }

  return response;
}
