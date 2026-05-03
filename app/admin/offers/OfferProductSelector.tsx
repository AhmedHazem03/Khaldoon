"use client";

import { useState, useTransition } from "react";
import { addOfferProduct } from "./actions";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Variant {
  id: string;
  variant_name: string;
  price: number;
  is_available: boolean;
}

interface Product {
  id: string;
  name: string;
  category_id: string | null;
  product_variants: Variant[];
}

interface LinkedItem {
  product_id: string | null;
  variant_id: string | null;
}

interface Props {
  offerId: string;
  categories: Category[];
  products: Product[];
  linkedItems: LinkedItem[];
}

export function OfferProductSelector({ offerId, categories, products, linkedItems }: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string>("");

  const filteredProducts = selectedCategoryId
    ? products.filter((p) => p.category_id === selectedCategoryId)
    : products;

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const availableVariants = selectedProduct?.product_variants.filter((v) => v.is_available) ?? [];
  const hasVariants = availableVariants.length > 0;

  function isLinked(productId: string, variantId: string | null) {
    return linkedItems.some(
      (item) => item.product_id === productId && item.variant_id === variantId
    );
  }

  const canAdd =
    !!selectedProductId &&
    !pending &&
    !isLinked(selectedProductId, hasVariants ? selectedVariantId : null);

  function handleAdd() {
    if (!canAdd) return;
    const formData = new FormData();
    formData.set("offer_id", offerId);
    formData.set("product_id", selectedProductId);
    if (hasVariants && selectedVariantId) {
      formData.set("variant_id", selectedVariantId);
    }

    startTransition(async () => {
      await addOfferProduct(formData);
      const label = selectedProduct?.name ?? "";
      const variantLabel =
        hasVariants && selectedVariantId
          ? ` — ${availableVariants.find((v) => v.id === selectedVariantId)?.variant_name}`
          : hasVariants
          ? " (كل الأحجام)"
          : "";
      setSuccessMsg(`تمت إضافة: ${label}${variantLabel}`);
      setSelectedProductId("");
      setSelectedVariantId(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    });
  }

  return (
    <div className="space-y-3">
      {/* ── Category filter pills ── */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          فلتر بالقسم
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedCategoryId("");
              setSelectedProductId("");
              setSelectedVariantId(null);
            }}
            className={`min-h-[32px] rounded-full px-3 text-xs font-bold transition-colors ${
              !selectedCategoryId
                ? "bg-[#0F293E] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategoryId(cat.id);
                setSelectedProductId("");
                setSelectedVariantId(null);
              }}
              className={`min-h-[32px] rounded-full px-3 text-xs font-bold transition-colors ${
                selectedCategoryId === cat.id
                  ? "bg-[#0F293E] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.icon ? `${cat.icon} ` : ""}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product list ── */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          اختر المنتج ({filteredProducts.length})
        </p>
        {filteredProducts.length === 0 ? (
          <p className="text-xs text-gray-400">لا توجد منتجات في هذا القسم</p>
        ) : (
          <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filteredProducts.map((product) => {
              const isSelected = selectedProductId === product.id;
              const allLinked =
                product.product_variants.length > 0
                  ? product.product_variants
                      .filter((v) => v.is_available)
                      .every((v) => isLinked(product.id, v.id))
                  : isLinked(product.id, null);

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={allLinked}
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setSelectedVariantId(null);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-right transition-colors text-sm ${
                    isSelected
                      ? "bg-[#E4570F]/10 text-[#E4570F] font-bold"
                      : allLinked
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 font-medium"
                  }`}
                >
                  <span className="flex-1 truncate">{product.name}</span>
                  {allLinked && (
                    <span className="shrink-0 text-[10px] text-green-600 font-bold bg-green-50 rounded-full px-2 py-0.5">
                      ✓ مضاف
                    </span>
                  )}
                  {product.product_variants.length > 0 && !allLinked && (
                    <span className="shrink-0 text-[10px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {product.product_variants.filter((v) => v.is_available).length} حجم
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Variant selector (only if product has variants) ── */}
      {selectedProduct && hasVariants && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            اختر الحجم/النوع — اتركه بدون اختيار لتطبيق العرض على الكل
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedVariantId(null)}
              className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition-colors ${
                selectedVariantId === null
                  ? "bg-[#0F293E] text-white border-[#0F293E]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#0F293E]"
              } ${
                isLinked(selectedProductId, null)
                  ? "opacity-40 cursor-not-allowed"
                  : ""
              }`}
              disabled={isLinked(selectedProductId, null)}
            >
              كل الأحجام
              {isLinked(selectedProductId, null) && " ✓"}
            </button>
            {availableVariants.map((v) => {
              const linked = isLinked(selectedProductId, v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={linked}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`min-h-[32px] rounded-full border px-3 text-xs font-bold transition-colors ${
                    selectedVariantId === v.id
                      ? "bg-[#E4570F] text-white border-[#E4570F] shadow-sm"
                      : linked
                      ? "opacity-40 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#E4570F]"
                  }`}
                >
                  {v.variant_name}
                  <span className="mr-1 text-[10px] opacity-70">— {v.price} ج</span>
                  {linked && " ✓"}
                </button>
              );
            })}
          </div>
          {selectedVariantId === null && (
            <p className="mt-1 text-[11px] text-amber-600">
              ⚠️ سيُطبَّق العرض على <strong>كل أحجام</strong> {selectedProduct.name}
            </p>
          )}
          {selectedVariantId && (
            <p className="mt-1 text-[11px] text-[#E4570F]">
              ✔ سيُطبَّق العرض على{" "}
              <strong>{availableVariants.find((v) => v.id === selectedVariantId)?.variant_name}</strong>{" "}
              فقط
            </p>
          )}
        </div>
      )}

      {/* ── Add button ── */}
      {selectedProduct && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className="min-h-[44px] px-5 rounded-lg bg-[#E4570F] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {pending ? "جاري الإضافة…" : isLinked(selectedProductId, hasVariants ? selectedVariantId : null) ? "✓ مضاف مسبقاً" : "+ إضافة للعرض"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProductId("");
              setSelectedVariantId(null);
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            إلغاء
          </button>
        </div>
      )}

      {/* ── Success message ── */}
      {successMsg && (
        <p className="text-xs font-bold text-green-700 bg-green-50 rounded-lg px-3 py-2">
          ✅ {successMsg}
        </p>
      )}
    </div>
  );
}
