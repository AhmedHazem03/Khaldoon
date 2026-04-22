import { createServerClient } from "@/lib/supabase-server";
import StatsCards from "@/components/admin/StatsCards";
import Link from "next/link";

export const metadata = { title: "لوحة التحكم — مطعم خلدون" };

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    { count: todayOrders },
    { count: weekOrders },
    { data: monthOrders },
    { count: newCustomers },
    { data: recentOrders },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday.toISOString()),

    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfWeek.toISOString()),

    supabase
      .from("orders")
      .select("id, total_price")
      .gte("created_at", startOfMonth.toISOString())
      .neq("status", "cancelled"),

    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth.toISOString()),

    supabase
      .from("orders")
      .select(
        "id, order_code, customer_name, customer_phone, order_type, total_price, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Fetch top items scoped to this month's non-cancelled orders
  const monthOrderIds = (monthOrders ?? []).map((o) => o.id);
  const { data: topItemsRaw } =
    monthOrderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("product_name, quantity")
          .in("order_id", monthOrderIds)
      : { data: [] as { product_name: string; quantity: number }[] };

  const totalRevenue =
    monthOrders?.reduce((sum, o) => sum + (o.total_price ?? 0), 0) ?? 0;

  // Tally top items from recent order_items
  const itemCounts: Record<string, number> = {};
  for (const item of topItemsRaw ?? []) {
    itemCounts[item.product_name] =
      (itemCounts[item.product_name] ?? 0) + item.quantity;
  }
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1E2A4A]">لوحة التحكم</h1>
        <Link
          href="/admin/orders"
          className="text-sm text-[#F26522] hover:underline"
        >
          كل الطلبات ←
        </Link>
      </div>

      <StatsCards
        todayOrders={todayOrders ?? 0}
        weekOrders={weekOrders ?? 0}
        monthOrders={monthOrders?.length ?? 0}
        totalRevenue={totalRevenue}
        newCustomers={newCustomers ?? 0}
        topItems={topItems}
      />

      {/* Recent orders preview */}
      {recentOrders && recentOrders.length > 0 && (
        <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-[#1E2A4A] mb-3">
            آخر الطلبات
          </h3>
          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-mono text-[#1E2A4A] font-semibold">
                  {o.order_code}
                </span>
                <span className="text-gray-600">{o.customer_name}</span>
                <span className="text-gray-500 text-xs">
                  {o.total_price.toLocaleString("ar-EG")} ج
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
