import { redirect } from "next/navigation";
import Link from "next/link";
import { createSessionClient, createServerClient } from "@/lib/supabase-server";
import { getSettings } from "@/lib/settings";
import { cancelOrder, signOut } from "./actions";

// ─── Status badge helper ────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  preparing: "قيد التحضير",
  out_for_delivery: "في الطريق",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  out_for_delivery: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const TX_LABELS: Record<string, string> = {
  earned: "نقاط مكتسبة",
  redeemed: "نقاط مستخدمة",
  manual_add: "إضافة يدوية",
  manual_deduct: "خصم يدوي",
  refunded: "استرداد نقاط",
  reversed: "إلغاء نقاط",
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const sessionClient = await createSessionClient();
  const {
    data: { user: authUser },
  } = await sessionClient.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const supabase = await createServerClient();

  // Fetch profile first to get public user ID
  const { data: profile } = await supabase
    .from("users")
    .select("id, name, phone_number, points_balance")
    .eq("auth_id", authUser.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const [{ data: orders }, { data: transactions }, settings] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_code, status, total_price, created_at, order_type, points_used"
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("point_transactions")
      .select("id, transaction_type, points, note, created_at, order_id")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
    getSettings(),
  ]);

  const now = new Date();

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text">{profile.name}</h1>
          <p className="text-sm text-gray-500">{profile.phone_number}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-[40px] px-4 rounded-xl border border-gray-300 text-sm text-gray-600"
          >
            تسجيل الخروج
          </button>
        </form>
      </div>

      {/* Points balance card */}
      <div className="bg-gradient-to-l from-primary to-blue-700 rounded-2xl p-5 text-white">
        <p className="text-sm opacity-80 mb-1">رصيد النقاط</p>
        <p className="text-4xl font-bold">{profile.points_balance ?? 0}</p>
        <p className="text-xs opacity-70 mt-1">نقطة = {settings.point_value_egp} ج خصم</p>
      </div>

      {/* Orders list */}
      <section>
        <h2 className="text-base font-bold text-text mb-3">طلباتي</h2>
        {!orders?.length ? (
          <div className="text-center text-gray-400 text-sm py-8">
            لا توجد طلبات بعد
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const createdAt = new Date(order.created_at);
              const canCancel =
                order.status === "pending" &&
                now.getTime() - createdAt.getTime() < 5 * 60 * 1000;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">
                      #{order.order_code}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {order.order_type === "delivery" ? "توصيل" : "استلام"}
                    </span>
                    <span className="font-medium text-text">
                      {order.total_price} ج
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {createdAt.toLocaleString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {canCancel && (
                    <form action={cancelOrder.bind(null, order.id)}>
                      <button
                        type="submit"
                        className="w-full min-h-[40px] rounded-xl border border-red-300 text-red-600 text-sm font-medium"
                      >
                        إلغاء الطلب
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Points history */}
      <section>
        <h2 className="text-base font-bold text-text mb-3">سجل النقاط</h2>
        {!transactions?.length ? (
          <div className="text-center text-gray-400 text-sm py-6">
            لا توجد معاملات نقاط بعد
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const isCredit = [
                "earned",
                "manual_add",
                "refunded",
              ].includes(tx.transaction_type);
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
                    className={`font-bold text-base ${isCredit ? "text-green-600" : "text-red-500"}`}
                  >
                    {isCredit ? "+" : "−"}
                    {tx.points}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Back to menu */}
      <Link
        href="/menu"
        className="block text-center text-sm text-accent underline py-2"
      >
        العودة للمنيو
      </Link>
    </div>
  );
}
