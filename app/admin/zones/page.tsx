import { createServerClient } from "@/lib/supabase-server";
import { addZone, toggleZone } from "./actions";
import ZoneFeeEditor from "./ZoneFeeEditor";

export const metadata = { title: "مناطق التوصيل — مطعم خلدون" };

export default async function AdminZonesPage() {
  const supabase = await createServerClient();
  const { data: zones } = await supabase
    .from("delivery_zones")
    .select("*")
    .order("zone_name", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1E2A4A]">مناطق التوصيل</h1>

      {/* Add zone */}
      <section className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-[#1E2A4A] mb-3">
          إضافة منطقة جديدة
        </h2>
        <form action={addZone} className="flex flex-wrap gap-2">
          <input
            type="text"
            name="zone_name"
            placeholder="اسم المنطقة"
            required
            className="flex-1 min-w-[160px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            name="fee"
            placeholder="رسوم التوصيل (ج)"
            required
            min="0"
            className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-lg bg-[#1E2A4A] text-white text-sm font-medium"
          >
            إضافة
          </button>
        </form>
      </section>

      {/* Zones list */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {(zones ?? []).length === 0 ? (
          <p className="text-center text-gray-400 py-8">لا توجد مناطق بعد</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-right text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">المنطقة</th>
                <th className="px-4 py-3 font-medium">رسوم التوصيل</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(zones ?? []).map((zone) => (
                <tr key={zone.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {zone.zone_name}
                  </td>
                  <td className="px-4 py-3">
                    <ZoneFeeEditor zoneId={zone.id} initialFee={zone.fee} />
                  </td>
                  <td className="px-4 py-3">
                    <form
                      action={async () => {
                        "use server";
                        await toggleZone(zone.id, !zone.is_active);
                      }}
                    >
                      <button
                        type="submit"
                        className={`text-xs px-2 py-1 rounded border min-h-[36px] ${
                          zone.is_active
                            ? "border-green-200 text-green-700 bg-green-50"
                            : "border-gray-200 text-gray-500"
                        }`}
                      >
                        {zone.is_active ? "مفعّل" : "معطّل"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
