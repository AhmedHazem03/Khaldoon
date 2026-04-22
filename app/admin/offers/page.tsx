import { createServerClient } from "@/lib/supabase-server";
import {
  addOffer,
  toggleOffer,
  deleteOffer,
  addOfferProduct,
  removeOfferProduct,
} from "./actions";
import { OfferImageUpload } from "./OfferImageUpload";
import { OfferEditForm } from "./OfferEditForm";
import { updateOffer } from "./actions";

export const metadata = { title: "العروض — مطعم خلدون" };

const BENEFIT_LABELS: Record<string, string> = {
  display_only:      "📢 إعلاني",
  discount_pct:      "🏷️ خصم %",
  discount_fixed:    "🏷️ خصم ج",
  points_multiplier: "⭐ نقاط مضاعفة",
  coupon_pct:        "🎟️ كوبون %",
  coupon_fixed:      "🎟️ كوبون ج",
};

const PRODUCT_OFFER_TYPES = ["discount_pct", "discount_fixed", "points_multiplier"];

export default async function AdminOffersPage() {
  const supabase = await createServerClient();

  const [{ data: offers }, { data: allProducts }] = await Promise.all([
    supabase
      .from("offers")
      .select("*, offer_products(id, product_id, order_index, products(id, name, image_url))")
      .order("order_index", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, image_url, is_available")
      .eq("is_available", true)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#1E2A4A]">إدارة العروض</h1>

      {/* ── Add offer form ──────────────────────────────────── */}
      <section className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-[#1E2A4A] mb-3">إضافة عرض جديد</h2>
        <form action={addOffer} className="grid grid-cols-1 gap-3 sm:grid-cols-2">

          {/* عنوان العرض */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">عنوان العرض</label>
            <input type="text" name="title" placeholder="مثال: عرض رمضان، خصم الصيف…" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">يظهر على البانر — اتركه فارغاً لو العرض بدون اسم</p>
          </div>

          {/* تاريخ الانتهاء */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">تاريخ الانتهاء</label>
            <input type="datetime-local" name="expires_at" aria-label="تاريخ انتهاء العرض" title="تاريخ انتهاء العرض" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">اتركه فارغاً إذا كان العرض مفتوحاً بلا تاريخ انتهاء</p>
          </div>

          {/* نوع الفائدة */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">نوع الفائدة</label>
            <select name="benefit_type" aria-label="نوع فائدة العرض" title="نوع فائدة العرض" className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
              <option value="display_only">📢 إعلاني فقط — بدون خصم</option>
              <option value="discount_pct">🏷️ خصم نسبة % على المنتجات</option>
              <option value="discount_fixed">🏷️ خصم مبلغ ثابت (جنيه) على المنتجات</option>
              <option value="points_multiplier">⭐ مضاعف النقاط على المنتجات</option>
              <option value="coupon_pct">🎟️ كوبون خصم نسبة % على الطلب</option>
              <option value="coupon_fixed">🎟️ كوبون خصم مبلغ ثابت (جنيه) على الطلب</option>
            </select>
            <p className="text-xs text-gray-400">الخصم/المضاعف يُطبَّق على المنتجات المرتبطة — الكوبون يُطبَّق على الطلب كله</p>
          </div>

          {/* قيمة الخصم */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">قيمة الخصم / المضاعف</label>
            <input type="number" name="benefit_value" placeholder="مثال: 20 لخصم 20% — أو 2 لمضاعفة النقاط ×2" min="0" step="0.01" aria-label="قيمة الخصم" title="قيمة الخصم" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">للإعلاني فقط اتركه 0 — للنسبة اكتب الرقم بدون % — للمضاعف اكتب العامل (مثال: 3)</p>
          </div>

          {/* كود الكوبون */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">كود الكوبون <span className="text-gray-400 font-normal">(للكوبونات فقط)</span></label>
            <input type="text" name="coupon_code" placeholder="مثال: RAMADAN25" aria-label="كود الكوبون" title="كود الكوبون" className="rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-widest font-mono" />
            <p className="text-xs text-gray-400">الكود اللي يكتبه الزبون في صفحة الدفع — يُحوَّل تلقائياً لحروف كبيرة</p>
          </div>

          {/* حد أدنى للطلب */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">حد أدنى للطلب <span className="text-gray-400 font-normal">(جنيه — للكوبونات فقط)</span></label>
            <input type="number" name="min_order_amount" defaultValue="0" min="0" placeholder="مثال: 150" aria-label="حد أدنى للطلب" title="حد أدنى للطلب" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">الكوبون لا يُقبَل إذا كان مجموع الطلب أقل من هذا الرقم — 0 يعني بلا حد</p>
          </div>

          {/* أقصى استخدامات */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">أقصى عدد استخدامات <span className="text-gray-400 font-normal">(للكوبونات فقط)</span></label>
            <input type="number" name="max_uses" min="1" placeholder="مثال: 50 — اتركه فارغاً = لا حد" aria-label="أقصى عدد استخدامات" title="أقصى عدد استخدامات" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">بعد الوصول لهذا العدد يُوقَف الكوبون تلقائياً — فارغ يعني غير محدود</p>
          </div>

          {/* الترتيب */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">الترتيب</label>
            <input type="number" name="order_index" defaultValue="0" placeholder="مثال: 1، 2، 3…" aria-label="الترتيب" title="الترتيب" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">الرقم الأصغر يظهر أولاً في قائمة العروض والكاروسيل</p>
          </div>

          <button type="submit" className="sm:col-span-2 min-h-[44px] px-5 rounded-lg bg-[#1E2A4A] text-white text-sm font-medium">
            + إضافة عرض
          </button>
        </form>
      </section>

      {/* ── Offers list ───────────────────────────────────── */}
      <div className="space-y-4">
        {(offers ?? []).length === 0 && (
          <p className="text-center text-gray-400 py-8">لا توجد عروض بعد</p>
        )}

        {(offers ?? []).map((offer) => {
          const linkedProducts = (offer.offer_products ?? []) as {
            id: string;
            product_id: string | null;
            products: { id: string; name: string; image_url: string | null } | null;
          }[];
          const linkedProductIds = new Set(linkedProducts.map((op) => op.product_id));
          const availableToAdd = (allProducts ?? []).filter((p) => !linkedProductIds.has(p.id));
          const isProductOffer = PRODUCT_OFFER_TYPES.includes(offer.benefit_type ?? "display_only");
          const isCoupon = (offer.benefit_type ?? "display_only").startsWith("coupon");

          return (
            <div key={offer.id} className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">

              {/* ── Top row: image + edit form + actions ── */}
              <div className="flex gap-3 p-4 items-start">
                <OfferImageUpload offerId={offer.id} currentImageUrl={offer.image_url} />

                <OfferEditForm offer={offer as Parameters<typeof OfferEditForm>[0]["offer"]} updateAction={updateOffer} />

                {/* Toggle + Delete */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <form action={async () => { "use server"; await toggleOffer(offer.id, !offer.is_active); }}>
                    <button type="submit" className={`text-xs px-3 py-2 rounded-lg border min-h-[44px] w-full ${offer.is_active ? "border-green-200 text-green-700 bg-green-50" : "border-gray-200 text-gray-500 bg-gray-50"}`}>
                      {offer.is_active ? "✅ مفعّل" : "⭕ معطّل"}
                    </button>
                  </form>
                  <form action={async () => { "use server"; await deleteOffer(offer.id); }}>
                    <button type="submit" className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 min-h-[44px] w-full">
                      🗑 حذف
                    </button>
                  </form>
                </div>
              </div>

              {/* ── Badges row ── */}
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#1E2A4A]/10 text-[#1E2A4A] rounded-full px-2 py-0.5">
                  {BENEFIT_LABELS[offer.benefit_type ?? "display_only"] ?? offer.benefit_type}
                  {offer.benefit_value > 0 && ` — ${offer.benefit_type === "points_multiplier" ? `×${offer.benefit_value}` : `${offer.benefit_value}${(offer.benefit_type ?? "").includes("pct") ? "%" : " ج"}`}`}
                </span>
                {isCoupon && offer.coupon_code && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-[#F26522]/10 text-[#F26522] border border-[#F26522]/20 rounded-full px-3 py-0.5">
                    🎟️ {offer.coupon_code}
                  </span>
                )}
                {isCoupon && offer.min_order_amount > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                    حد أدنى: {offer.min_order_amount} ج
                  </span>
                )}
                {isCoupon && (
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                    الاستخدام: {offer.uses_count ?? 0}{offer.max_uses ? `/${offer.max_uses}` : " (لا حد)"}
                  </span>
                )}
                {offer.expires_at && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    ⏰ ينتهي: {new Date(offer.expires_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                )}
              </div>

              {/* ── Products section (only for product-level types) ── */}
              {(isProductOffer || !isCoupon) && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#1E2A4A]">
                    {isProductOffer ? "المنتجات التي يُطبَّق عليها الخصم/المضاعف" : "المنتجات المعروضة في البانر"}
                    {" "}({linkedProducts.length})
                  </p>

                  {linkedProducts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedProducts.map((op) =>
                        op.products ? (
                          <div key={op.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs">
                            <span className="text-gray-700">{op.products.name}</span>
                            <form action={async () => { "use server"; await removeOfferProduct(op.id); }}>
                              <button type="submit" className="text-red-400 hover:text-red-600 leading-none min-h-[24px] min-w-[24px] flex items-center justify-center" title="إزالة">×</button>
                            </form>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                  {availableToAdd.length > 0 && (
                    <form action={addOfferProduct} className="flex gap-2 items-center">
                      <input type="hidden" name="offer_id" value={offer.id} />
                      <select name="product_id" aria-label="اختر منتجاً لإضافته" title="اختر منتجاً" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white">
                        <option value="">— اختر منتجاً لإضافته —</option>
                        {availableToAdd.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button type="submit" className="min-h-[44px] px-4 rounded-lg bg-[#F26522] text-white text-sm font-medium whitespace-nowrap">
                        + إضافة
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
