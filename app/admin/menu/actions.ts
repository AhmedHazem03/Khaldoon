"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, requireAdmin } from "@/lib/supabase-server";

// ── Shared Cloudinary helper ──────────────────────────────────────────────────
async function uploadToCloudinary(
  file: File,
  publicId: string,
  folder: string
): Promise<string> {
  const { v2: cloudinary } = await import("cloudinary");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
          transformation: [
            { width: 800, crop: "limit", quality: "auto:good", fetch_format: "auto" },
          ],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

function validateImageFile(
  file: File | null
): { error: string } | null {
  if (!file || file.size === 0) return null; // optional — no error, just skip
  if (file.size > 5 * 1024 * 1024) return { error: "الصورة أكبر من 5MB" };
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    return { error: "نوع الصورة غير مدعوم (JPG/PNG/WebP فقط)" };
  return null;
}

export async function upsertCategory(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string).trim();
  const icon = (formData.get("icon") as string).trim();
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;
  const is_visible = formData.get("is_visible") === "true";

  if (!name) return;

  if (id) {
    await supabase
      .from("categories")
      .update({ name, icon, order_index, is_visible })
      .eq("id", id);
  } else {
    await supabase
      .from("categories")
      .insert({ name, icon, order_index, is_visible });
  }
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  const supabase = await createServerClient();
  await supabase.from("categories").delete().eq("id", categoryId);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function upsertProduct(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const id = formData.get("id") as string | null;
  const category_id = formData.get("category_id") as string;
  const name = (formData.get("name") as string).trim();
  const description = (formData.get("description") as string).trim();
  const base_price_raw = formData.get("base_price") as string;
  const base_price = base_price_raw ? parseInt(base_price_raw, 10) : null;
  const cta_type = formData.get("cta_type") as string || "add_to_cart";
  const is_available = formData.get("is_available") === "true";
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;

  if (!name || !category_id) return;

  const payload = {
    category_id,
    name,
    description: description || null,
    base_price,
    cta_type,
    is_available,
    order_index,
  };

  if (id) {
    await supabase.from("products").update(payload).eq("id", id);
  } else {
    await supabase.from("products").insert(payload);
  }
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  const supabase = await createServerClient();
  await supabase.from("products").delete().eq("id", productId);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function upsertVariant(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const id = formData.get("id") as string | null;
  const product_id = formData.get("product_id") as string;
  const variant_name = (formData.get("variant_name") as string).trim();
  const price = parseInt(formData.get("price") as string, 10);
  const is_available = formData.get("is_available") === "true";
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;

  if (!variant_name || !product_id || isNaN(price)) return;

  if (id) {
    await supabase
      .from("product_variants")
      .update({ variant_name, price, is_available, order_index })
      .eq("id", id);
  } else {
    await supabase
      .from("product_variants")
      .insert({ product_id, variant_name, price, is_available, order_index });
  }
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function deleteVariant(variantId: string) {
  await requireAdmin();
  const supabase = await createServerClient();
  await supabase.from("product_variants").delete().eq("id", variantId);
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function uploadProductImage(
  productId: string,
  _prevState: { imageUrl: string | null; error: string | null } | null,
  formData: FormData
): Promise<{ imageUrl: string | null; error: string | null }> {
  await requireAdmin();
  const file = formData.get("image") as File | null;
  const validationError = validateImageFile(file);
  if (validationError) return { imageUrl: null, error: validationError.error };
  if (!file || file.size === 0) return { imageUrl: null, error: "لم يتم اختيار صورة" };

  const imageUrl = await uploadToCloudinary(file, `product-${productId}`, "khaldoun/menu");

  const supabase = await createServerClient();
  await supabase.from("products").update({ image_url: imageUrl }).eq("id", productId);

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { imageUrl, error: null };
}

export async function uploadCategoryImage(
  categoryId: string,
  _prevState: { imageUrl: string | null; error: string | null } | null,
  formData: FormData
): Promise<{ imageUrl: string | null; error: string | null }> {
  await requireAdmin();
  const file = formData.get("image") as File | null;
  const validationError = validateImageFile(file);
  if (validationError) return { imageUrl: null, error: validationError.error };
  if (!file || file.size === 0) return { imageUrl: null, error: "لم يتم اختيار صورة" };

  const imageUrl = await uploadToCloudinary(file, `category-${categoryId}`, "khaldoun/categories");

  const supabase = await createServerClient();
  await supabase.from("categories").update({ image_url: imageUrl }).eq("id", categoryId);

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { imageUrl, error: null };
}

export async function addProductWithImage(
  _prevState: { error: string | null } | null,
  formData: FormData
): Promise<{ error: string | null }> {
  await requireAdmin();
  const supabase = await createServerClient();

  const category_id = formData.get("category_id") as string;
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const base_price_raw = formData.get("base_price") as string;
  const base_price = base_price_raw ? parseInt(base_price_raw, 10) : null;
  const cta_type = (formData.get("cta_type") as string) || "add_to_cart";
  const is_available = formData.get("is_available") === "true";
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;
  const file = formData.get("image") as File | null;

  if (!name || !category_id) return { error: "اسم المنتج والقسم مطلوبان" };

  const validationError = validateImageFile(file);
  if (validationError) return { error: validationError.error };

  // Insert product and return the new row's id
  const { data, error: insertError } = await supabase
    .from("products")
    .insert({ category_id, name, description: description || null, base_price, cta_type, is_available, order_index })
    .select("id")
    .single();

  if (insertError || !data) return { error: insertError?.message ?? "فشل الحفظ" };

  // Upload image if provided
  if (file && file.size > 0) {
    const imageUrl = await uploadToCloudinary(file, `product-${data.id}`, "khaldoun/menu");
    await supabase.from("products").update({ image_url: imageUrl }).eq("id", data.id);
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  return { error: null };
}

