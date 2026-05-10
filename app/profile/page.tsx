import Link from "next/link";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";
import { signOut } from "./actions";
import GoogleSignInButton from "@/components/profile/GoogleSignInButton";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import OrderCard, { type OrderCardData } from "@/components/profile/OrderCard";
import GuestOrders from "@/components/profile/GuestOrders";

const TX_LABELS: Record<string, string> = {
  earned: "نقاط مكتسبة",
  redeemed: "نقاط مستخدمة",
  manual_add: "إضافة يدوية",
  manual_deduct: "خصم يدوي",
  refunded: "استرداد نقاط",
  reversed: "إلغاء نقاط",
};

export default async function ProfilePage() {
  const sessionClient = await createSessionClient();
  const {
    data: { user: authUser },
  } = await sessionClient.auth.getUser();

  const settings = await getSettings();

  let profile: {
    id: string;
    name: string | null;
    phone_number: string | null;
    default_address: string | null;
    points_balance: number;
  } | null = null;

  let orders: OrderCardData[] = [];

  let transactions: Array<{
    id: string;
    transaction_type: string;
    points: number;
    note: string | null;
    created_at: string;
  }> = [];

  if (authUser) {
    const supabase = await createServerClient();

    const { data: profileData } = await supabase
      .from("users")
      .select("id, name, phone_number, default_address, points_balance")
      .eq("auth_id", authUser.id)
      .single();

    profile = profileData;

    if (profile) {
      const now = Date.now();
      const [{ data: ordersData }, { data: txData }] = await Promise.all([
        supabase
          .from("orders")
          .select(
            "id, order_code, status, total_price, created_at, order_type, points_used, order_items(product_name, variant_name, unit_price, quantity)"
          )
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("point_transactions")
          .select("id, transaction_type, points, note, created_at")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);

      orders = ((ordersData ?? []) as unknown as Omit<OrderCardData, "canCancel">[]).map(
        (order) => ({
          ...order,
          order_items: (order.order_items as OrderCardData["order_items"]) ?? [],
          canCancel:
            order.status === "pending" &&
            now - new Date(order.created_at).getTime() < 5 * 60 * 1000,
        })
      );

      transactions = txData ?? [];
    }
  }

  const isLoggedIn = !!authUser && !!profile;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">حسابي</h1>
        {isLoggedIn && (
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-[40px] px-4 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              تسجيل الخروج
            </button>
          </form>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — البيانات الشخصية
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-text">البيانات الشخصية</h2>

        {isLoggedIn ? (
          <ProfileEditForm
            name={profile!.name}
            phone_number={profile!.phone_number}
            default_address={profile!.default_address}
            email={authUser!.email ?? null}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center space-y-3">
            <div className="text-3xl">👤</div>
            <p className="text-gray-500 text-sm">سجّل دخولك لعرض بياناتك وتعديلها</p>
            <GoogleSignInButton />
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — طلباتي
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-text">طلباتي</h2>

        {!isLoggedIn ? (
          <div className="space-y-3">
            {/* Orders from the current session (guest_token in sessionStorage) */}
            <GuestOrders />

            {/* Sign-in prompt */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center space-y-3">
              <div className="text-3xl">🧾</div>
              <p className="text-gray-500 text-sm">
                سجّل دخولك لحفظ طلباتك وتتابعها في أي وقت
              </p>
              <GoogleSignInButton />
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm py-10">
            لا توجد طلبات بعد
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — النقاط
      ══════════════════════════════════════════════════════ */}
      <section className="space-y-2">
        <h2 className="text-base font-bold text-text">النقاط</h2>

        {isLoggedIn ? (
          <>
            {/* Balance card */}
            <div className="bg-gradient-to-l from-primary to-blue-700 rounded-2xl p-5 text-white">
              <p className="text-sm opacity-80 mb-1">رصيد النقاط</p>
              <p className="text-4xl font-bold">{profile!.points_balance ?? 0}</p>
              <p className="text-xs opacity-70 mt-1">
                نقطة = {settings.point_value_egp} ج خصم على طلباتك
              </p>
            </div>

            {/* Transaction history */}
            {transactions.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-6">
                لا توجد معاملات نقاط بعد
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isCredit = ["earned", "manual_add", "refunded"].includes(
                    tx.transaction_type
                  );
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm text-text">
                          {TX_LABELS[tx.transaction_type] ?? tx.transaction_type}
                        </p>
                        {tx.note && (
                          <p className="text-xs text-gray-400 mt-0.5">{tx.note}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(tx.created_at).toLocaleDateString("ar-EG", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                      <span
                        className={`font-bold text-base ${
                          isCredit ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {isCredit ? "+" : "−"}
                        {tx.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Guest — locked points section */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="bg-gradient-to-l from-primary to-blue-700 rounded-xl p-4 text-white text-center">
              <p className="text-sm opacity-80 mb-2">اكسب نقاطاً على كل طلب</p>
              <p className="text-3xl font-black tracking-widest opacity-50">⭐ ⭐ ⭐</p>
              <p className="text-xs opacity-70 mt-2">
                نقطة = {settings.point_value_egp} ج خصم
              </p>
            </div>
            <p className="text-gray-500 text-sm text-center leading-relaxed">
              سجّل دخولك واكسب نقاطاً على كل طلب
              <br />
              واستخدمها كخصم في طلباتك القادمة
            </p>
            <GoogleSignInButton />
          </div>
        )}
      </section>

      <Link
        href="/menu"
        className="block text-center text-sm text-accent underline py-2"
      >
        العودة للمنيو
      </Link>
    </div>
  );
}
