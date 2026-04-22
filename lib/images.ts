/**
 * Returns an optimized image URL.
 * - Cloudinary URLs: uses on-the-fly transformation parameters
 * - Supabase Storage URLs: uses the built-in transform query params
 * - Other URLs: returned as-is
 */
export function getImageUrl(
  url: string | null | undefined,
  width = 400,
  height?: number
): string | null {
  if (!url) return null;

  if (url.includes("cloudinary.com")) {
    const h = height ? `,h_${height}` : "";
    const crop = height ? ",c_fill" : ",c_limit";
    return url.replace(
      "/upload/",
      `/upload/w_${width}${h}${crop},q_auto,f_auto/`
    );
  }

  // Supabase Storage
  if (url.includes("supabase")) {
    const params = new URLSearchParams({ width: String(width), quality: "75" });
    if (height) params.set("height", String(height));
    return `${url}?${params.toString()}`;
  }

  return url;
}
