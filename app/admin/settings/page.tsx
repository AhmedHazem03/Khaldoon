import { getSettings } from "@/lib/settings";
import { saveSettings } from "./actions";

export const metadata = { title: "الإعدادات — مطعم خلدون" };

const FIELD_GROUPS = [
  {
    title: "واتساب والتواصل الاجتماعي",
    fields: [
      {
        key: "whatsapp_order_number",
        label: "رقم واتساب الطلبات (دولي)",
        hint: 'مثال: 201064414303 (بدون + أو مسافات)',
        type: "text",
      },
      {
        key: "whatsapp_social_url",
        label: "رابط واتساب (للتواصل)",
        hint: "مثال: https://wa.me/201064414303",
        type: "url",
      },
      { key: "facebook_url", label: "رابط فيسبوك", hint: "", type: "url" },
      { key: "instagram_url", label: "رابط إنستغرام", hint: "", type: "url" },
      { key: "tiktok_url", label: "رابط تيك توك", hint: "", type: "url" },
    ],
  },
  {
    title: "أرقام الهواتف والعنوان",
    fields: [
      { key: "phone_1", label: "هاتف 1", hint: "", type: "tel" },
      { key: "phone_2", label: "هاتف 2 (اختياري)", hint: "", type: "tel" },
      { key: "phone_3", label: "هاتف 3 (اختياري)", hint: "", type: "tel" },
      {
        key: "restaurant_address",
        label: "عنوان المطعم",
        hint: "",
        type: "text",
      },
    ],
  },
  {
    title: "الطلبات",
    fields: [
      {
        key: "delivery_enabled",
        label: "تفعيل التوصيل",
        hint: "true أو false",
        type: "text",
      },
      {
        key: "pickup_enabled",
        label: "تفعيل الاستلام من المطعم",
        hint: "true أو false",
        type: "text",
      },
      {
        key: "is_ordering_open",
        label: "المطعم مفتوح للطلبات؟",
        hint: "true أو false",
        type: "text",
      },
      {
        key: "working_hours",
        label: "ساعات العمل",
        hint: 'مثال: 10:00 ص — 2:00 ص',
        type: "text",
      },
    ],
  },
  {
    title: "نقاط الولاء",
    fields: [
      {
        key: "points_per_100_egp",
        label: "نقاط لكل 100 ج",
        hint: "عدد صحيح، مثال: 1",
        type: "number",
      },
      {
        key: "point_value_egp",
        label: "قيمة النقطة (ج)",
        hint: "مثال: 0.5",
        type: "number",
      },
      {
        key: "max_points_discount_pct",
        label: "الحد الأقصى لخصم النقاط (%)",
        hint: "مثال: 20",
        type: "number",
      },
    ],
  },
  {
    title: "إحصائيات الصفحة الرئيسية",
    fields: [
      {
        key: "stat_customers",
        label: "عدد العملاء (للعرض)",
        hint: "رقم يُعرض في الصفحة الرئيسية، مثال: 5000",
        type: "text",
      },
      {
        key: "stat_years",
        label: "سنوات الخبرة (للعرض)",
        hint: "مثال: 10",
        type: "text",
      },
      {
        key: "stat_followers",
        label: "عدد المتابعين (للعرض)",
        hint: "مثال: 226000 — يُعرض في شريط الإحصائيات",
        type: "text",
      },
      {
        key: "stat_delivery_time",
        label: "وقت التوصيل (دقائق)",
        hint: "مثال: 30",
        type: "number",
      },
      {
        key: "stat_rating",
        label: "التقييم (من 5)",
        hint: "مثال: 4.9",
        type: "number",
      },
      {
        key: "established_year",
        label: "سنة التأسيس",
        hint: "مثال: 1998 — يظهر في Hero وقصة العلامة",
        type: "text",
      },
    ],
  },
  {
    title: "محتوى الصفحة الرئيسية",
    fields: [
      {
        key: "brand_story",
        label: "قصة المطعم",
        hint: "نص قصير يظهر في قسم 'قصة خلدون' — اتركه فارغاً للنص الافتراضي",
        type: "text",
      },
      {
        key: "hero_video_url",
        label: "رابط فيديو الـ Hero (اختياري)",
        hint: "رابط مباشر لملف فيديو قصير (mp4) يظهر خلفية الـ Hero",
        type: "url",
      },
    ],
  },
];

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0F293E]">الإعدادات</h1>

      <form action={saveSettings} className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <section
            key={group.title}
            className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-4"
          >
            <h2 className="text-sm font-semibold text-[#0F293E] border-b border-gray-100 pb-2">
              {group.title}
            </h2>
            {group.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label
                  htmlFor={field.key}
                  className="block text-sm font-medium text-gray-700"
                >
                  {field.label}
                </label>
                <input
                  id={field.key}
                  type={field.type}
                  name={field.key}
                  defaultValue={
                    settings[field.key as keyof typeof settings] ?? ""
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F293E]"
                  dir={field.type === "url" || field.type === "tel" ? "ltr" : undefined}
                />
                {field.hint && (
                  <p className="text-xs text-gray-400">{field.hint}</p>
                )}
              </div>
            ))}
          </section>
        ))}

        <button
          type="submit"
          className="w-full min-h-[52px] rounded-xl bg-[#0F293E] text-white font-semibold text-base"
        >
          حفظ جميع الإعدادات
        </button>
      </form>
    </div>
  );
}
