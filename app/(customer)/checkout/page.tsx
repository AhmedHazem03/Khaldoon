import { getSettings } from "@/lib/settings";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import CheckoutForm from "./CheckoutForm";

export default async function CheckoutPage() {
  const settings = await getSettings();

  if (settings.is_ordering_open === "false") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <span className="text-5xl">🔒</span>
        <h1 className="text-xl font-bold text-text">المطعم مغلق حالياً</h1>
        <p className="text-sm text-gray-500">يُرجى المحاولة في وقت لاحق</p>
      </div>
    );
  }

  // Check if a registered user is logged in and fetch their profile
  let userProfile:
    | {
        id: string;
        name: string;
        phone_number: string;
        default_address: string | null;
        points_balance: number;
      }
    | undefined;

  try {
    const sessionClient = await createSessionClient();
    const {
      data: { user: authUser },
    } = await sessionClient.auth.getUser();

    if (authUser) {
      const serviceClient = await createServerClient();
      const { data: profile } = await serviceClient
        .from("users")
        .select("id, name, phone_number, default_address, points_balance")
        .eq("auth_id", authUser.id)
        .single();

      if (profile) {
        userProfile = {
          id: profile.id,
          name: profile.name ?? "",
          phone_number: profile.phone_number ?? "",
          default_address: profile.default_address ?? null,
          points_balance: profile.points_balance ?? 0,
        };
      }
    }
  } catch {
    // non-critical — fall back to guest checkout
  }

  return (
    <CheckoutForm
      settings={{
        whatsapp_order_number: settings.whatsapp_order_number,
        point_value_egp: settings.point_value_egp,
        points_per_100_egp: settings.points_per_100_egp,
        max_points_discount_pct: settings.max_points_discount_pct,
        is_ordering_open: settings.is_ordering_open,
      }}
      userProfile={userProfile}
    />
  );
}
