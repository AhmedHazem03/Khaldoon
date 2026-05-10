import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase-server";
import { getImageUrl } from "@/lib/images";
import AddOfferToCartButton from "./AddOfferToCartButton";

// Explicit types — Supabase TS inference collapses to `never` with nested selects
type OfferVariant = { id: string; variant_name: string; price: number; is_available: boolean };
type OfferLinkedProduct = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  order_index: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
    base_price: number | null;
    product_variants: OfferVariant[];
  } | null;
};
type OfferRow = {
  id: string;
  title: string | null;
  image_url: string | null;
  expires_at: string | null;
  is_active: boolean;
  benefit_type: string;
  benefit_value: number;
  coupon_code: string | null;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  offer_products: OfferLinkedProduct[];
};

const BENEFIT_LABELS: Record<string, string> = {
  display_only: "عرض إعلاني",
  discount_pct: "خصم نسبة مئوية",
  discount_fixed: "خصم مبلغ ثابت",
  points_multiplier: "مضاعفة نقاط",
  coupon_pct: "كوبون نسبة مئوية",
  coupon_fixed: "كوبون مبلغ ثابت",
};

function calcDiscounted(price: number, benefitType: string, benefitValue: number) {
  if (benefitType === "discount_pct") return price * (1 - benefitValue / 100);
  if (benefitType === "discount_fixed") return Math.max(0, price - benefitValue);
  return null;
}

function formatBenefitValue(benefitType: string, benefitValue: number) {
  if (benefitType === "display_only" || benefitValue <= 0) return "بدون قيمة خصم";
  if (benefitType === "points_multiplier") return `x${benefitValue} نقاط`;
  if (benefitType.includes("pct")) return `${benefitValue}%`;
  return `${benefitValue} جنيه`;
}

function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return "مفتوح بدون تاريخ انتهاء";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return date.toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OfferDetailsPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = await params;
  const supabase = await createServerClient();

  const { data: rawOffer } = await supabase
    .from("offers")
    .select("*, offer_products(id, product_id, variant_id, order_index, products(id, name, image_url, base_price, product_variants(id, variant_name, price, is_available)))")
    .eq("id", offerId)
    .eq("is_active", true)
    .maybeSingle();

  if (!rawOffer) notFound();
  const offer = rawOffer as unknown as OfferRow;

  const linkedProducts = offer.offer_products.filter((item) => item.products?.name);
  const imageUrl = getImageUrl(offer.image_url, 1200, 800);
  const isDiscount = offer.benefit_type === "discount_pct" || offer.benefit_type === "discount_fixed";

  return (
    <main className="min-h-screen bg-background pb-8">
      <section className="relative isolate overflow-hidden bg-[#081723]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(242,101,34,0.22),transparent_34%)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-xs font-bold text-white/88"
            >
              رجوع للرئيسية
            </Link>
            <span className="inline-flex min-h-10 items-center rounded-full bg-accent/20 px-4 text-xs font-black text-[#ffd2b3]">
              تفاصيل العرض
            </span>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/7 backdrop-blur-sm">
            <div className="relative h-56 sm:h-72">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={offer.title ?? "عرض"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f9d7a6_0%,#e4570f_36%,#0f293e_100%)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#081723] via-[#081723]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                  {offer.title?.trim() || "عرض خاص من مطعم خلدون"}
                </h1>
                <p className="mt-2 text-sm font-medium text-white/78">
                  {BENEFIT_LABELS[offer.benefit_type] ?? offer.benefit_type}
                </p>
              </div>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <div className="rounded-2xl border border-primary/8 bg-white px-4 py-3">
                <p className="text-xs font-bold text-primary/65">قيمة الفائدة</p>
                <p className="mt-1 text-lg font-black text-primary">
                  {formatBenefitValue(offer.benefit_type, offer.benefit_value)}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/8 bg-white px-4 py-3">
                <p className="text-xs font-bold text-primary/65">حالة العرض</p>
                <p className="mt-1 text-lg font-black text-primary">
                  {offer.is_active ? "مفعل" : "غير مفعل"}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/8 bg-white px-4 py-3 sm:col-span-2">
                <p className="text-xs font-bold text-primary/65">ينتهي في</p>
                <p className="mt-1 text-sm font-bold text-primary">
                  {formatExpiry(offer.expires_at)}
                </p>
              </div>

              {offer.coupon_code && (
                <div className="rounded-2xl border border-accent/25 bg-accent/8 px-4 py-3 sm:col-span-2">
                  <p className="text-xs font-bold text-primary/65">كود الكوبون</p>
                  <p className="mt-1 text-xl font-black tracking-widest text-accent">{offer.coupon_code}</p>
                  <p className="mt-2 text-xs font-medium text-primary/70">
                    الحد الأدنى: {offer.min_order_amount || 0} جنيه
                    {offer.max_uses ? ` • الحد الأقصى: ${offer.max_uses}` : " • بدون حد استخدام"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pt-6">
        <div className="rounded-[1.4rem] border border-primary/8 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-primary">المنتجات المشمولة في العرض</h2>
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-black text-accent">
              {linkedProducts.length}
            </span>
          </div>

          {linkedProducts.length === 0 ? (
            <p className="text-sm font-medium text-primary/65">هذا العرض غير مربوط بمنتجات محددة حالياً.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {linkedProducts.map((item) => {
                const product = item.products as {
                  id: string;
                  name: string;
                  image_url: string | null;
                  base_price: number | null;
                  product_variants?: { id: string; variant_name: string; price: number; is_available: boolean }[];
                } | null;
                if (!product) return null;

                const allVariants = product.product_variants?.filter((v) => v.is_available) ?? [];
                const variants = item.variant_id
                  ? allVariants.filter((v) => v.id === item.variant_id)
                  : allVariants;
                const basePrice = product.base_price;
                const hasVariants = variants.length > 0;

                return (
                  <div key={item.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-[#fffaf5]">
                    <div className="flex items-center gap-3 p-3">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary/6">
                        {product.image_url ? (
                          <Image
                            src={getImageUrl(product.image_url, 200, 200) ?? product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-primary">{product.name}</p>
                        {isDiscount && basePrice != null && variants.length === 0 && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-medium text-primary/50 line-through">
                              {basePrice.toFixed(0)} ج
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent px-2 py-0.5 text-xs font-black text-white shadow-[0_4px_10px_rgba(228,87,15,0.3)]">
                              {calcDiscounted(basePrice, offer.benefit_type, offer.benefit_value)?.toFixed(0)} ج
                            </span>
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-black text-green-700">
                              وفّرت{" "}
                              {offer.benefit_type === "discount_pct"
                                ? `${offer.benefit_value}%`
                                : `${offer.benefit_value} ج`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {isDiscount && hasVariants && (
                      <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                        <p className="mb-2 text-[10px] font-black tracking-widest text-primary/50 uppercase">الأحجام والأسعار</p>
                        <div className="flex flex-col gap-1.5">
                          {variants.map((v) => {
                            const discounted = calcDiscounted(v.price, offer.benefit_type, offer.benefit_value);
                            return (
                              <div key={v.id} className="flex items-center justify-between gap-3">
                                <span className="text-xs font-bold text-primary/80">{v.variant_name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-primary/45 line-through">{v.price.toFixed(0)} ج</span>
                                  <span className="rounded-full bg-[linear-gradient(135deg,#ff7a2f,#e4570f)] px-2.5 py-0.5 text-[11px] font-black text-white shadow-sm">
                                    {discounted?.toFixed(0)} ج
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <AddOfferToCartButton
              products={(linkedProducts.map((item) => item.products).filter(Boolean) as {
                id: string;
                name: string;
                image_url: string | null;
                base_price: number | null;
                product_variants?: { id: string; variant_name: string; price: number; is_available: boolean }[];
              }[])}
              benefitType={offer.benefit_type}
              benefitValue={offer.benefit_value}
            />
            <Link
              href="/menu"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary/15 px-5 text-sm font-bold text-primary"
            >
              تصفح المنيو
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
