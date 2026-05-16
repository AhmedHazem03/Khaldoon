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

async function destroyCloudinaryAsset(publicId: string): Promise<void> {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return;
  }
  try {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (err) {
    // Best-effort: if Cloudinary destroy fails we still want the DB delete to succeed.
    console.error("[cloudinary] destroy failed for", publicId, err);
  }
}

export async function upsertCategory(formData: FormData) {
  await requireAdmin();
  const supabase = await createServerClient();
  const id = formData.get("id") as string | null;
  const name = (formData.get("name") as string).trim();
  const icon = (formData.get("icon") as string | null)?.trim() ?? "";
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;
  const is_visible = formData.get("is_visible") === "true";
  const iconImageFile = formData.get("icon_image") as File | null;

  if (!name) return;

  let categoryId = id;

  if (id) {
    const { error } = await supabase
      .from("categories")
      .update({ name, icon, order_index, is_visible })
      .eq("id", id);
    if (error) {
      console.error("[upsertCategory] update failed", error);
      throw new Error(`فشل تحديث القسم: ${error.message}`);
    }
  } else {
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, icon, order_index, is_visible })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[upsertCategory] insert failed", error);
      throw new Error(`فشل إضافة القسم: ${error?.message ?? "فشل الحفظ"}`);
    }
    categoryId = data.id;
  }

  // Upload custom icon image if provided
  if (iconImageFile && iconImageFile.size > 0 && categoryId) {
    const validationError = validateImageFile(iconImageFile);
    if (!validationError) {
      const imageUrl = await uploadToCloudinary(
        iconImageFile,
        `category-icon-${categoryId}`,
        "khaldoun/categories"
      );
      await supabase.from("categories").update({ image_url: imageUrl }).eq("id", categoryId);
    }
  }

  revalidatePath("/admin/menu");
  revalidatePath("/menu");
  revalidatePath("/");
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) {
    console.error("[deleteCategory] delete failed", error);
    throw new Error(`فشل حذف القسم: ${error.message}`);
  }

  // Both the legacy and current category image asset ids are removed.
  await destroyCloudinaryAsset(`khaldoun/categories/category-${categoryId}`);
  await destroyCloudinaryAsset(`khaldoun/categories/category-icon-${categoryId}`);

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
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) {
      console.error("[upsertProduct] update failed", error);
      throw new Error(`فشل تحديث المنتج: ${error.message}`);
    }
  } else {
    const { error } = await supabase.from("products").insert(payload);
    if (error) {
      console.error("[upsertProduct] insert failed", error);
      throw new Error(`فشل إضافة المنتج: ${error.message}`);
    }
  }
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    console.error("[deleteProduct] delete failed", error);
    throw new Error(`فشل حذف المنتج: ${error.message}`);
  }

  await destroyCloudinaryAsset(`khaldoun/menu/product-${productId}`);

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
    const { error } = await supabase
      .from("product_variants")
      .update({ variant_name, price, is_available, order_index })
      .eq("id", id);
    if (error) {
      console.error("[upsertVariant] update failed", error);
      throw new Error(`فشل تحديث المتغير: ${error.message}`);
    }
  } else {
    const { error } = await supabase
      .from("product_variants")
      .insert({ product_id, variant_name, price, is_available, order_index });
    if (error) {
      console.error("[upsertVariant] insert failed", error);
      throw new Error(`فشل إضافة المتغير: ${error.message}`);
    }
  }
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export async function deleteVariant(variantId: string) {
  await requireAdmin();
  const supabase = await createServerClient();
  const { error } = await supabase.from("product_variants").delete().eq("id", variantId);
  if (error) {
    console.error("[deleteVariant] delete failed", error);
    throw new Error(`فشل حذف المتغير: ${error.message}`);
  }
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

