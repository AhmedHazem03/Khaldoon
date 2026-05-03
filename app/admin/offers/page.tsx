import { createServerClient } from "@/lib/supabase-server";
import {
  addOffer,
  toggleOffer,
  deleteOffer,
  removeOfferProduct,
  updateOffer,
} from "./actions";
import { OfferImageUpload } from "./OfferImageUpload";
import { OfferEditForm } from "./OfferEditForm";
import { OfferProductSelector } from "./OfferProductSelector";
import type { Offer } from "@/types/app";

// Local types — explicit cast bypasses Supabase TS inference issues with variant_id
type OfferRow = {
  id: string;
  title: string | null;
  image_url: string | null;
  expires_at: string | null;
  is_active: boolean;
  order_index: number;
  benefit_type: string;
  benefit_value: number;
  coupon_code: string | null;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  offer_products: Array<{
    id: string;
    product_id: string | null;
    variant_id: string | null;
    order_index: number;
    products: { id: string; name: string; image_url: string | null } | null;
  }>;
};
type ProductRow = { id: string; name: string; category_id: string | null };
type VariantRow = { id: string; product_id: string; variant_name: string; price: number; is_available: boolean };
type CategoryRow = { id: string; name: string; icon: string | null };

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

  const [offersRes, productsRes, categoriesRes, variantsRes] = await Promise.all([
    supabase.from("offers")
      .select("*, offer_products(id, product_id, variant_id, order_index, products(id, name, image_url))")
      .order("order_index", { ascending: true }),
    supabase.from("products").select("id, name, category_id").eq("is_available", true).order("name", { ascending: true }),
    supabase.from("categories").select("id, name, icon").eq("is_visible", true).order("order_index", { ascending: true }),
    supabase.from("product_variants").select("id, product_id, variant_name, price, is_available").eq("is_available", true).order("order_index", { ascending: true }),
  ]);

  const offers = (offersRes.data ?? []) as unknown as OfferRow[];
  const rawProducts = (productsRes.data ?? []) as unknown as ProductRow[];
  const categories = (categoriesRes.data ?? []) as unknown as CategoryRow[];
  const allVariants = (variantsRes.data ?? []) as unknown as VariantRow[];
  const allProducts = rawProducts.map((p) => ({ ...p, product_variants: allVariants.filter((v) => v.product_id === p.id) }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-[#0F293E]">إدارة العروض</h1>

      <section className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-[#0F293E] mb-3">إضافة عرض جديد</h2>
        <form action={addOffer} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">عنوان العرض</label>
            <input type="text" name="title" placeholder="مثال: عرض رمضان خصم الصيف…" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">يظهر على البانر — اتركه فارغا لو العرض بدون اسم</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">تاريخ الانتهاء</label>
            <input type="datetime-local" name="expires_at" aria-label="تاريخ انتهاء العرض" title="تاريخ انتهاء العرض" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <p className="text-xs text-gray-400">اتركه فارغا إذا كان العرض مفتوحا بلا تاريخ انتهاء</p>
          </div>
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
            <p className="text-xs text-gray-400">الخصم/المضاعف يطبق على المنتجات المرتبطة</p>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">قيمة الخصم / المضاعف</label>
            <input type="number" name="benefit_value" placeholder="مثال: 20 لخصم 20%" min="0" step="0.01" aria-label="قيمة الخصم" title="قيمة الخصم" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">كود الكوبون <span className="text-gray-400 font-normal">(للكوبونات فقط)</span></label>
            <input type="text" name="coupon_code" placeholder="مثال: RAMADAN25" aria-label="كود الكوبون" title="كود الكوبون" className="rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase tracking-widest font-mono" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">حد أدنى للطلب <span className="text-gray-400 font-normal">(جنيه)</span></label>
            <input type="number" name="min_order_amount" defaultValue="0" min="0" aria-label="حد أدنى للطلب" title="حد أدنى للطلب" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">أقصى عدد استخدامات <span className="text-gray-400 font-normal">(للكوبونات)</span></label>
            <input type="number" name="max_uses" min="1" placeholder="فارغ = لا حد" aria-label="أقصى عدد استخدامات" title="أقصى عدد استخدامات" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">الترتيب</label>
            <input type="number" name="order_index" defaultValue="0" aria-label="الترتيب" title="الترتيب" className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="sm:col-span-2 min-h-[44px] px-5 rounded-lg bg-[#0F293E] text-white text-sm font-medium">
            + إضافة عرض
          </button>
        </form>
      </section>

      <div className="space-y-4">
        {offers.length === 0 && <p className="text-center text-gray-400 py-8">لا توجد عروض بعد</p>}

        {offers.map((offer) => {
          const linkedItems = offer.offer_products;
          const isProductOffer = PRODUCT_OFFER_TYPES.includes(offer.benefit_type ?? "display_only");
          const isCoupon = (offer.benefit_type ?? "display_only").startsWith("coupon");

          return (
            <div key={offer.id} className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex gap-3 p-4 items-start">
                <OfferImageUpload offerId={offer.id} currentImageUrl={offer.image_url} />
                <OfferEditForm offer={offer as unknown as Offer} updateAction={updateOffer} />
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <form action={async () => { "use server"; await toggleOffer(offer.id, !offer.is_active); }}>
                    <button type="submit" className={`text-xs px-3 py-2 rounded-lg border min-h-[44px] w-full ${offer.is_active ? "border-green-200 text-green-700 bg-green-50" : "border-gray-200 text-gray-500 bg-gray-50"}`}>
                      {offer.is_active ? "✅ مفعل" : "⭕ معطل"}
                    </button>
                  </form>
                  <form action={async () => { "use server"; await deleteOffer(offer.id); }}>
                    <button type="submit" className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 min-h-[44px] w-full">🗑 حذف</button>
                  </form>
                </div>
              </div>

              <div className="px-4 pb-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#0F293E]/10 text-[#0F293E] rounded-full px-2 py-0.5">
                  {BENEFIT_LABELS[offer.benefit_type ?? "display_only"] ?? offer.benefit_type}
                  {offer.benefit_value > 0 && ` — ${offer.benefit_type === "points_multiplier" ? `×${offer.benefit_value}` : `${offer.benefit_value}${(offer.benefit_type ?? "").includes("pct") ? "%" : " ج"}`}`}
                </span>
                {isCoupon && offer.coupon_code && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold bg-[#E4570F]/10 text-[#E4570F] border border-[#E4570F]/20 rounded-full px-3 py-0.5">🎟️ {offer.coupon_code}</span>
                )}
                {isCoupon && offer.min_order_amount > 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">حد أدنى: {offer.min_order_amount} ج</span>
                )}
                {isCoupon && (
                  <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">الاستخدام: {offer.uses_count ?? 0}{offer.max_uses ? `/${offer.max_uses}` : " (لا حد)"}</span>
                )}
                {offer.expires_at && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                    ⏰ ينتهي: {new Date(offer.expires_at).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                )}
              </div>

              {(isProductOffer || !isCoupon) && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#0F293E]">
                    {isProductOffer ? "المنتجات التي يطبق عليها الخصم/المضاعف" : "المنتجات المعروضة في البانر"}
                    {" "}({linkedItems.length})
                  </p>

                  {linkedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {linkedItems.map((op) =>
                        op.products ? (
                          <div key={op.id} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs">
                            <span className="text-gray-700">{op.products.name}</span>
                            {op.variant_id && (() => {
                              const vName = allProducts.find((p) => p.id === op.product_id)?.product_variants.find((v) => v.id === op.variant_id)?.variant_name;
                              return vName ? <span className="text-[#E4570F] font-bold">— {vName}</span> : null;
                            })()}
                            {!op.variant_id && <span className="text-gray-400">(كل الأحجام)</span>}
                            <form action={async () => { "use server"; await removeOfferProduct(op.id); }}>
                              <button type="submit" className="text-red-400 hover:text-red-600 leading-none min-h-[24px] min-w-[24px] flex items-center justify-center" title="إزالة">×</button>
                            </form>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}

                  <OfferProductSelector
                    offerId={offer.id}
                    categories={categories}
                    products={allProducts}
                    linkedItems={linkedItems.map((op) => ({ product_id: op.product_id, variant_id: op.variant_id }))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
