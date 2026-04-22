import { createServerClient } from "@/lib/supabase-server";
import PointsManager from "@/components/admin/PointsManager";
import Link from "next/link";

export const metadata = { title: "العملاء — مطعم خلدون" };

const PAGE_SIZE = 25;

interface PageProps {
  searchParams: Promise<{ q?: string; cursor?: string }>;
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const cursor = params.cursor ?? null;

  const supabase = await createServerClient();

  let query = supabase
    .from("users")
    .select("id, name, phone_number, points_balance, created_at")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1); // fetch one extra to detect next page

  if (q) {
    query = query.or(`phone_number.ilike.%${q}%,name.ilike.%${q}%`);
  }
  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data: rawUsers } = await query;

  const hasNextPage = (rawUsers?.length ?? 0) > PAGE_SIZE;
  const users = (rawUsers ?? []).slice(0, PAGE_SIZE);
  const nextCursor = hasNextPage ? users[users.length - 1]?.created_at : null;

  // Fetch order counts for each user
  const userIds = users.map((u) => u.id);
  const { data: orderCounts } = await supabase
    .from("orders")
    .select("user_id")
    .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

  const countByUser: Record<string, number> = {};
  for (const o of orderCounts ?? []) {
    if (o.user_id) countByUser[o.user_id] = (countByUser[o.user_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1E2A4A]">العملاء المسجلون</h1>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="بحث بالاسم أو رقم الهاتف"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E2A4A]"
        />
        <button
          type="submit"
          className="min-h-[44px] px-4 rounded-lg bg-[#1E2A4A] text-white text-sm font-medium"
        >
          بحث
        </button>
      </form>

      {/* Customers list */}
      <div className="space-y-4">
        {users.length === 0 && (
          <p className="text-center text-gray-400 py-8">لا يوجد عملاء</p>
        )}
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-3"
          >
            {/* User info */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#1E2A4A]">
                  {user.name ?? "بدون اسم"}
                </p>
                <p className="text-sm text-gray-500" dir="ltr">
                  {user.phone_number}
                </p>
              </div>
              <div className="text-left text-sm space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">النقاط:</span>
                  <span className="font-bold text-[#F26522]">
                    {user.points_balance}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">الطلبات:</span>
                  <span className="text-gray-700">{countByUser[user.id] ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Points manager */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                تعديل النقاط يدوياً
              </p>
              <PointsManager
                userId={user.id}
                currentBalance={user.points_balance}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {(hasNextPage || cursor) && (
        <div className="flex items-center justify-between pt-2">
          {cursor ? (
            <Link
              href={`/admin/customers?q=${encodeURIComponent(q)}`}
              className="min-h-[44px] px-5 rounded-lg border border-gray-200 text-sm text-gray-600 flex items-center hover:bg-gray-50"
            >
              الأول
            </Link>
          ) : (
            <div />
          )}
          {hasNextPage && nextCursor && (
            <Link
              href={`/admin/customers?q=${encodeURIComponent(q)}&cursor=${encodeURIComponent(nextCursor)}`}
              className="min-h-[44px] px-5 rounded-lg bg-[#1E2A4A] text-white text-sm flex items-center"
            >
              التالي
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
