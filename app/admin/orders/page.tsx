import { createServerClient } from "@/lib/supabase-server";
import OrdersTable from "@/components/admin/OrdersTable";
import Link from "next/link";

export const metadata = { title: "الطلبات — مطعم خلدون" };

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "", label: "كل الحالات" },
  { value: "pending", label: "قيد الانتظار" },
  { value: "confirmed", label: "مؤكد" },
  { value: "preparing", label: "قيد التحضير" },
  { value: "out_for_delivery", label: "في الطريق" },
  { value: "delivered", label: "تم التسليم" },
  { value: "cancelled", label: "ملغي" },
];

interface PageProps {
  searchParams: Promise<{
    status?: string;
    q?: string;
    cursor?: string;
  }>;
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status ?? "";
  const q = params.q ?? "";
  const cursor = params.cursor ?? null;

  const supabase = await createServerClient();

  let query = supabase
    .from("orders")
    .select(
      "id, order_code, customer_name, customer_phone, order_type, total_price, status, created_at, zone_id, delivery_zones(zone_name)"
    )
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1); // fetch one extra to detect next page

  if (status) {
    query = query.eq("status", status);
  }
  if (q) {
    query = query.or(
      `order_code.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_name.ilike.%${q}%`
    );
  }
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: rawOrders } = await query;

  const hasNextPage = (rawOrders?.length ?? 0) > PAGE_SIZE;
  const orders = (rawOrders ?? []).slice(0, PAGE_SIZE).map((o) => ({
    id: o.id,
    order_code: o.order_code,
    customer_name: o.customer_name,
    customer_phone: o.customer_phone,
    order_type: o.order_type as "delivery" | "pickup",
    total_price: o.total_price,
    status: o.status as
      | "pending"
      | "confirmed"
      | "preparing"
      | "out_for_delivery"
      | "delivered"
      | "cancelled",
    created_at: o.created_at,
    zone_name:
      o.delivery_zones && typeof o.delivery_zones === "object" && !Array.isArray(o.delivery_zones)
        ? (o.delivery_zones as { zone_name: string }).zone_name
        : null,
  }));

  const nextCursor =
    hasNextPage && orders.length > 0
      ? orders[orders.length - 1].created_at
      : null;

  // Build URL helpers
  function buildUrl(extra: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q) p.set("q", q);
    Object.entries(extra).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    const qs = p.toString();
    return `/admin/orders${qs ? "?" + qs : ""}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-[#0F293E]">الطلبات</h1>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="بحث بالكود، الاسم، أو الهاتف"
          className="flex-1 min-w-[180px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F293E]"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="فلترة بالحالة"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F293E]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="min-h-[44px] px-4 rounded-lg bg-[#0F293E] text-white text-sm font-medium"
        >
          بحث
        </button>
        {(q || status) && (
          <Link
            href="/admin/orders"
            className="min-h-[44px] flex items-center px-4 rounded-lg border border-gray-200 text-sm text-gray-600"
          >
            مسح
          </Link>
        )}
      </form>

      <OrdersTable orders={orders} />

      {/* Cursor pagination */}
      <div className="flex justify-between text-sm">
        {cursor ? (
          <Link
            href={buildUrl({ cursor: undefined })}
            className="text-[#0F293E] hover:underline"
          >
            ← الأحدث
          </Link>
        ) : (
          <span />
        )}
        {nextCursor && (
          <Link
            href={buildUrl({ cursor: nextCursor })}
            className="text-[#0F293E] hover:underline"
          >
            التالي →
          </Link>
        )}
      </div>
    </div>
  );
}
