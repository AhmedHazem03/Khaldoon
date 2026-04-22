import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase-server";
import {
  upsertCategory,
  deleteCategory,
  upsertProduct,
  deleteProduct,
  upsertVariant,
  deleteVariant,
} from "./actions";
import type { Category, Product, ProductVariant } from "@/types/app";
import { MenuSearch } from "./MenuSearch";
import { ImageUpload } from "./ImageUpload";
import { CategoryImageUpload } from "./CategoryImageUpload";
import { AddProductForm } from "./AddProductForm";

export const metadata = { title: "إدارة المنيو — مطعم خلدون" };

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = await createServerClient();

  const [{ data: categories }, { data: products }, { data: variants }] =
    await Promise.all([
      supabase.from("categories").select("*").order("order_index"),
      supabase.from("products").select("*").order("order_index"),
      supabase.from("product_variants").select("*").order("order_index"),
    ]);

  const allCategories = (categories ?? []) as Category[];
  const allProducts = (products ?? []) as Product[];
  const allVariants = (variants ?? []) as ProductVariant[];

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCategories = allCategories.length;
  const totalProducts = allProducts.length;
  const availableProducts = allProducts.filter((p) => p.is_available).length;
  const unavailableProducts = totalProducts - availableProducts;

  // ── Search filter ──────────────────────────────────────────────────────────
  const qLower = q.trim().toLowerCase();

  const matchedProductIds = new Set(
    qLower
      ? allProducts.filter((p) => p.name.toLowerCase().includes(qLower)).map((p) => p.id)
      : allProducts.map((p) => p.id)
  );

  const filteredCategories = allCategories.filter((c) => {
    if (!qLower) return true;
    if (c.name.toLowerCase().includes(qLower)) return true;
    return allProducts.some((p) => p.category_id === c.id && matchedProductIds.has(p.id));
  });

  // ── Group data ─────────────────────────────────────────────────────────────
  const variantsByProduct: Record<string, ProductVariant[]> = {};
  for (const v of allVariants) {
    if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
    variantsByProduct[v.product_id].push(v);
  }

  const productsByCategory: Record<string, Product[]> = {};
  for (const p of allProducts) {
    if (!matchedProductIds.has(p.id)) continue;
    const catId = p.category_id ?? "__none__";
    if (!productsByCategory[catId]) productsByCategory[catId] = [];
    productsByCategory[catId].push(p);
  }

  return (
    <div className="space-y-6">
      {/* ── Header + Stats ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#1E2A4A]">إدارة المنيو</h1>
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="bg-[#1E2A4A]/10 text-[#1E2A4A] rounded-full px-3 py-1.5">
            {totalCategories} قسم
          </span>
          <span className="bg-[#F26522]/10 text-[#F26522] rounded-full px-3 py-1.5">
            {totalProducts} منتج
          </span>
          <span className="bg-green-50 text-green-700 rounded-full px-3 py-1.5">
            ✓ {availableProducts} متاح
          </span>
          {unavailableProducts > 0 && (
            <span className="bg-red-50 text-red-600 rounded-full px-3 py-1.5">
              ✗ {unavailableProducts} غير متاح
            </span>
          )}
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <Suspense>
        <MenuSearch defaultValue={q} />
      </Suspense>

      {/* ── Add Category ────────────────────────────────────────────────────── */}
      <section className="rounded-xl bg-white p-4 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-[#1E2A4A] mb-3">
          ➕ إضافة قسم جديد
        </h2>
        <form action={upsertCategory} className="flex flex-wrap gap-2">
          <input type="hidden" name="is_visible" value="true" />
          <input
            type="text"
            name="name"
            placeholder="اسم القسم *"
            required
            className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="text"
            name="icon"
            placeholder="أيقونة (emoji)"
            className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm text-center"
          />
          <input
            type="number"
            name="order_index"
            placeholder="الترتيب"
            defaultValue="0"
            className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-lg bg-[#1E2A4A] text-white text-sm font-medium"
          >
            إضافة
          </button>
        </form>
      </section>

      {/* ── No results ──────────────────────────────────────────────────────── */}
      {qLower && filteredCategories.length === 0 && (
        <p className="text-center text-gray-400 py-10">
          لا توجد نتائج لـ &quot;{q}&quot;
        </p>
      )}

      {/* ── Categories ──────────────────────────────────────────────────────── */}
      {filteredCategories.map((cat) => (
        <section
          key={cat.id}
          className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Category header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3 min-w-0">
              {/* Category image upload */}
              <CategoryImageUpload
                categoryId={cat.id}
                categoryName={cat.name}
                currentImageUrl={cat.image_url ?? null}
              />
              <div className="min-w-0">
                <span className="font-semibold text-[#1E2A4A]">
                  {cat.icon} {cat.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-gray-400">
                    ({(productsByCategory[cat.id] ?? []).length} منتج)
                  </span>
                  {!cat.is_visible && (
                    <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded px-1.5 py-0.5">
                      مخفي
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <form action={upsertCategory}>
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="name" value={cat.name} />
                <input type="hidden" name="icon" value={cat.icon ?? ""} />
                <input type="hidden" name="order_index" value={cat.order_index} />
                <input
                  type="hidden"
                  name="is_visible"
                  value={cat.is_visible ? "false" : "true"}
                />
                <button
                  type="submit"
                  className="text-xs px-2.5 py-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 min-h-[32px]"
                >
                  {cat.is_visible ? "إخفاء" : "إظهار"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteCategory(cat.id);
                }}
              >
                <button
                  type="submit"
                  className="text-xs px-2.5 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 min-h-[32px]"
                >
                  حذف
                </button>
              </form>
            </div>
          </div>

          {/* Edit category inline form */}
          <details className="border-b border-gray-100">
            <summary className="px-4 py-2 text-xs text-[#1E2A4A] cursor-pointer list-none hover:bg-gray-50">
              ✏️ تعديل بيانات القسم
            </summary>
            <form
              action={upsertCategory}
              className="px-4 py-3 flex flex-wrap gap-2 bg-blue-50/30"
            >
              <input type="hidden" name="id" value={cat.id} />
              <input
                type="text"
                name="name"
                defaultValue={cat.name}
                placeholder="اسم القسم *"
                required
                className="flex-1 min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <input
                type="text"
                name="icon"
                defaultValue={cat.icon ?? ""}
                placeholder="أيقونة"
                className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm text-center"
              />
              <input
                type="number"
                name="order_index"
                defaultValue={cat.order_index}
                placeholder="الترتيب"
                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
              <select
                name="is_visible"
                defaultValue={cat.is_visible ? "true" : "false"}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="true">ظاهر</option>
                <option value="false">مخفي</option>
              </select>
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-lg bg-[#1E2A4A] text-white text-sm font-medium"
              >
                حفظ التعديل
              </button>
            </form>
          </details>

          {/* Products */}
          <div className="p-4 space-y-4">
            {(productsByCategory[cat.id] ?? []).map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                categories={allCategories}
                variants={variantsByProduct[product.id] ?? []}
              />
            ))}

            {/* Add product */}
            <details className="border border-dashed border-gray-200 rounded-lg">
              <summary className="px-3 py-2 text-sm text-[#F26522] cursor-pointer list-none">
                ➕ إضافة منتج في {cat.name}
              </summary>
              <AddProductForm categoryId={cat.id} categoryName={cat.name} />
            </details>
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── ProductRow ───────────────────────────────────────────────────────────────

function ProductRow({
  product,
  categories,
  variants,
}: {
  product: Product;
  categories: Category[];
  variants: ProductVariant[];
}) {
  const ctaLabel =
    product.cta_type === "whatsapp_inquiry" ? "استفسار واتساب" : "أضف للطلب";

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Product summary row */}
      <div className="flex items-start gap-3 p-3">
        {/* Image / upload */}
        <div className="flex-shrink-0">
          <ImageUpload productId={product.id} currentImageUrl={product.image_url} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm text-gray-800">{product.name}</p>
              {product.description && (
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                  {product.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {product.base_price != null && (
                  <span className="text-xs bg-orange-50 text-[#F26522] rounded px-1.5 py-0.5">
                    {product.base_price} ج
                  </span>
                )}
                <span
                  className={`text-xs rounded px-1.5 py-0.5 ${
                    product.is_available
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {product.is_available ? "✓ متاح" : "✗ غير متاح"}
                </span>
                <span className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">
                  {ctaLabel}
                </span>
                <span className="text-xs bg-gray-50 text-gray-400 rounded px-1.5 py-0.5">
                  ترتيب: {product.order_index}
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1 flex-shrink-0">
              <form action={upsertProduct}>
                <input type="hidden" name="id" value={product.id} />
                <input type="hidden" name="category_id" value={product.category_id ?? ""} />
                <input type="hidden" name="name" value={product.name} />
                <input type="hidden" name="description" value={product.description ?? ""} />
                <input type="hidden" name="base_price" value={product.base_price ?? ""} />
                <input type="hidden" name="cta_type" value={product.cta_type} />
                <input
                  type="hidden"
                  name="is_available"
                  value={product.is_available ? "false" : "true"}
                />
                <input type="hidden" name="order_index" value={product.order_index} />
                <button
                  type="submit"
                  className={`text-xs px-2 py-1.5 rounded border min-h-[32px] ${
                    product.is_available
                      ? "border-green-200 text-green-700 hover:bg-green-50"
                      : "border-gray-200 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {product.is_available ? "إيقاف" : "تفعيل"}
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await deleteProduct(product.id);
                }}
              >
                <button
                  type="submit"
                  className="text-xs px-2 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 min-h-[32px]"
                >
                  حذف
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Edit product form */}
      <details className="border-t border-gray-100">
        <summary className="px-3 py-2 text-xs text-[#1E2A4A] cursor-pointer list-none hover:bg-gray-50">
          ✏️ تعديل المنتج
        </summary>
        <form action={upsertProduct} className="p-3 space-y-2 bg-blue-50/20">
          <input type="hidden" name="id" value={product.id} />
          <div className="flex gap-2">
            <input
              type="text"
              name="name"
              defaultValue={product.name}
              placeholder="اسم المنتج *"
              required
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              name="base_price"
              defaultValue={product.base_price ?? ""}
              placeholder="السعر (ج)"
              className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <textarea
            name="description"
            defaultValue={product.description ?? ""}
            placeholder="الوصف"
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <select
              name="category_id"
              defaultValue={product.category_id ?? ""}
              className="rounded-lg border border-gray-200 px-2 py-2 text-sm flex-1 min-w-[130px]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <select
              name="cta_type"
              defaultValue={product.cta_type}
              className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
            >
              <option value="add_to_cart">أضف للطلب</option>
              <option value="whatsapp_inquiry">استفسار واتساب</option>
            </select>
            <select
              name="is_available"
              defaultValue={product.is_available ? "true" : "false"}
              className="rounded-lg border border-gray-200 px-2 py-2 text-sm"
            >
              <option value="true">متاح</option>
              <option value="false">غير متاح</option>
            </select>
            <input
              type="number"
              name="order_index"
              defaultValue={product.order_index}
              placeholder="الترتيب"
              className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-lg bg-[#1E2A4A] text-white text-sm font-medium"
            >
              حفظ
            </button>
          </div>
        </form>
      </details>

      {/* Variants */}
      <div className="border-t border-gray-100 px-3 py-2 space-y-1.5">
        {variants.length > 0 && (
          <p className="text-xs font-medium text-gray-400 pb-0.5">المتغيرات:</p>
        )}
        {variants.map((v) => (
          <VariantRow key={v.id} variant={v} />
        ))}

        {/* Add variant */}
        <details className="mt-1">
          <summary className="text-xs text-[#F26522] cursor-pointer list-none py-1">
            ➕ إضافة متغير
          </summary>
          <form action={upsertVariant} className="flex flex-wrap gap-1.5 mt-1.5">
            <input type="hidden" name="product_id" value={product.id} />
            <input type="hidden" name="is_available" value="true" />
            <input
              type="text"
              name="variant_name"
              placeholder="الاسم *"
              required
              className="flex-1 min-w-[120px] rounded border border-gray-200 px-2 py-1.5 text-xs"
            />
            <input
              type="number"
              name="price"
              placeholder="السعر *"
              required
              className="w-24 rounded border border-gray-200 px-2 py-1.5 text-xs"
            />
            <input
              type="number"
              name="order_index"
              defaultValue="0"
              placeholder="الترتيب"
              className="w-20 rounded border border-gray-200 px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-[#1E2A4A] text-white text-xs min-h-[32px]"
            >
              إضافة
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}

// ─── VariantRow ───────────────────────────────────────────────────────────────

function VariantRow({ variant }: { variant: ProductVariant }) {
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-700 font-medium">{variant.variant_name}</span>
          <span className="text-[#F26522] font-semibold">{variant.price} ج</span>
          <span
            className={`rounded px-1 py-0.5 ${
              variant.is_available
                ? "bg-green-50 text-green-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {variant.is_available ? "متاح" : "موقف"}
          </span>
          <span className="text-gray-300">#{variant.order_index}</span>
        </div>
        <div className="flex gap-1">
          {/* Toggle availability */}
          <form action={upsertVariant}>
            <input type="hidden" name="id" value={variant.id} />
            <input type="hidden" name="product_id" value={variant.product_id} />
            <input type="hidden" name="variant_name" value={variant.variant_name} />
            <input type="hidden" name="price" value={variant.price} />
            <input
              type="hidden"
              name="is_available"
              value={variant.is_available ? "false" : "true"}
            />
            <input type="hidden" name="order_index" value={variant.order_index} />
            <button
              type="submit"
              className="text-xs px-1.5 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 min-h-[28px]"
            >
              {variant.is_available ? "إيقاف" : "تفعيل"}
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await deleteVariant(variant.id);
            }}
          >
            <button
              type="submit"
              className="text-xs px-1.5 py-1 rounded border border-red-200 text-red-500 hover:bg-red-50 min-h-[28px]"
            >
              حذف
            </button>
          </form>
        </div>
      </div>

      {/* Edit variant inline */}
      <details>
        <summary className="px-2 py-1 text-[10px] text-[#1E2A4A] cursor-pointer list-none hover:bg-gray-100">
          ✏️ تعديل
        </summary>
        <form action={upsertVariant} className="px-2 py-2 flex flex-wrap gap-1.5 bg-blue-50/30">
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="product_id" value={variant.product_id} />
          <input
            type="text"
            name="variant_name"
            defaultValue={variant.variant_name}
            placeholder="الاسم *"
            required
            className="flex-1 min-w-[100px] rounded border border-gray-200 px-2 py-1.5 text-xs"
          />
          <input
            type="number"
            name="price"
            defaultValue={variant.price}
            placeholder="السعر *"
            required
            className="w-24 rounded border border-gray-200 px-2 py-1.5 text-xs"
          />
          <input
            type="number"
            name="order_index"
            defaultValue={variant.order_index}
            placeholder="الترتيب"
            className="w-20 rounded border border-gray-200 px-2 py-1.5 text-xs"
          />
          <select
            name="is_available"
            defaultValue={variant.is_available ? "true" : "false"}
            className="rounded border border-gray-200 px-2 py-1.5 text-xs"
          >
            <option value="true">متاح</option>
            <option value="false">موقف</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 rounded bg-[#1E2A4A] text-white text-xs min-h-[32px]"
          >
            حفظ
          </button>
        </form>
      </details>
    </div>
  );
}
