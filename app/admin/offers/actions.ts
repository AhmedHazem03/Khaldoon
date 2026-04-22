"use server";

import { revalidatePath } from "next/cache";
import { revalidateTag } from "next/cache";
import { createServerClient } from "@/lib/supabase-server";

// ── Shared Cloudinary helper ──────────────────────────────────────────────────
async function uploadToCloudinary(file: File, publicId: string, folder: string): Promise<string> {
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
            { width: 1200, crop: "limit", quality: "auto:good", fetch_format: "auto" },
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

function validateImageFile(file: File | null): { error: string } | null {
  if (!file || file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) return { error: "الصورة أكبر من 5MB" };
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { error: "نوع الصورة غير مدعوم (JPG/PNG/WebP فقط)" };
  return null;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function addOffer(formData: FormData) {
  const supabase = await createServerClient();
  const title = (formData.get("title") as string | null)?.trim();
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;
  const expires_at = (formData.get("expires_at") as string | null) || null;
  const benefit_type = (formData.get("benefit_type") as string) || "display_only";
  const benefit_value = parseFloat(formData.get("benefit_value") as string) || 0;
  const coupon_code = (formData.get("coupon_code") as string | null)?.trim().toUpperCase() || null;
  const min_order_amount = parseInt(formData.get("min_order_amount") as string, 10) || 0;
  const max_uses_raw = formData.get("max_uses") as string | null;
  const max_uses = max_uses_raw ? parseInt(max_uses_raw, 10) : null;

  await supabase.from("offers").insert({
    title: title || null,
    is_active: true,
    order_index,
    expires_at: expires_at || null,
    benefit_type,
    benefit_value,
    coupon_code,
    min_order_amount,
    max_uses,
  });

  revalidatePath("/admin/offers");
  revalidateTag("settings", "default");
  revalidatePath("/");
}

export async function updateOffer(formData: FormData) {
  const supabase = await createServerClient();
  const id = formData.get("id") as string;
  const title = (formData.get("title") as string | null)?.trim();
  const order_index = parseInt(formData.get("order_index") as string, 10) || 0;
  const expires_at = (formData.get("expires_at") as string | null) || null;
  const benefit_type = (formData.get("benefit_type") as string) || "display_only";
  const benefit_value = parseFloat(formData.get("benefit_value") as string) || 0;
  const coupon_code = (formData.get("coupon_code") as string | null)?.trim().toUpperCase() || null;
  const min_order_amount = parseInt(formData.get("min_order_amount") as string, 10) || 0;
  const max_uses_raw = formData.get("max_uses") as string | null;
  const max_uses = max_uses_raw ? parseInt(max_uses_raw, 10) : null;

  if (!id) return;

  await supabase
    .from("offers")
    .update({
      title: title || null,
      order_index,
      expires_at: expires_at || null,
      benefit_type,
      benefit_value,
      coupon_code,
      min_order_amount,
      max_uses,
    })
    .eq("id", id);

  revalidatePath("/admin/offers");
  revalidatePath("/");
}

export async function toggleOffer(offerId: string, isActive: boolean) {
  const supabase = await createServerClient();
  await supabase.from("offers").update({ is_active: isActive }).eq("id", offerId);
  revalidatePath("/admin/offers");
  revalidatePath("/");
}

export async function deleteOffer(offerId: string) {
  const supabase = await createServerClient();
  await supabase.from("offers").delete().eq("id", offerId);
  revalidatePath("/admin/offers");
  revalidatePath("/");
}

export async function updateOfferOrder(offerId: string, order_index: number) {
  const supabase = await createServerClient();
  await supabase.from("offers").update({ order_index }).eq("id", offerId);
  revalidatePath("/admin/offers");
  revalidatePath("/");
}

// ── Image upload ──────────────────────────────────────────────────────────────

export async function uploadOfferImage(
  offerId: string,
  _prevState: { imageUrl: string | null; error: string | null } | null,
  formData: FormData
): Promise<{ imageUrl: string | null; error: string | null }> {
  const file = formData.get("image") as File | null;
  const validationError = validateImageFile(file);
  if (validationError) return { imageUrl: null, error: validationError.error };
  if (!file || file.size === 0) return { imageUrl: null, error: "لم يتم اختيار صورة" };

  const imageUrl = await uploadToCloudinary(file, `offer-${offerId}`, "khaldoun/offers");

  const supabase = await createServerClient();
  await supabase.from("offers").update({ image_url: imageUrl }).eq("id", offerId);

  revalidatePath("/admin/offers");
  revalidatePath("/");
  return { imageUrl, error: null };
}

// ── Offer ↔ Products ─────────────────────────────────────────────────────────

export async function addOfferProduct(formData: FormData) {
  const supabase = await createServerClient();
  const offer_id = formData.get("offer_id") as string;
  const product_id = formData.get("product_id") as string;

  if (!offer_id || !product_id) return;

  await supabase.from("offer_products").upsert(
    { offer_id, product_id },
    { onConflict: "offer_id,product_id", ignoreDuplicates: true }
  );

  revalidatePath("/admin/offers");
}

export async function removeOfferProduct(offerProductId: string) {
  const supabase = await createServerClient();
  await supabase.from("offer_products").delete().eq("id", offerProductId);
  revalidatePath("/admin/offers");
}
