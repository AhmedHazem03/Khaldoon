import type { Order, OrderItem, Settings } from "@/types/app";

const MAX_URL_LENGTH = 2048;

/**
 * Build a formatted Arabic WhatsApp message for an order.
 * Format: order code → items+variants+prices → subtotal → delivery → points discount → total → points earned
 */
export function generateWhatsAppMessage(
  order: Pick<
    Order,
    | "order_code"
    | "order_type"
    | "subtotal"
    | "delivery_fee"
    | "discount_amount"
    | "offer_discount"
    | "total_price"
    | "points_used"
    | "points_earned"
    | "customer_name"
    | "customer_phone"
    | "delivery_address"
    | "notes"
  >,
  items: Array<
    Pick<OrderItem, "product_name" | "variant_name" | "unit_price" | "quantity">
  >,
  settings: Pick<Settings, "point_value_egp">
): string {
  const lines: string[] = [];

  lines.push(`🧾 طلب جديد — ${order.order_code}`);
  lines.push(`👤 الاسم: ${order.customer_name}`);
  lines.push(`📞 الهاتف: ${order.customer_phone}`);

  if (order.order_type === "delivery") {
    lines.push(`🚚 توصيل إلى: ${order.delivery_address ?? ""}`);
  } else {
    lines.push(`🏪 استلام من المطعم`);
  }

  lines.push(`\n📋 الطلب:`);

  for (const item of items) {
    const variantPart = item.variant_name ? ` (${item.variant_name})` : "";
    lines.push(
      `• ${item.product_name}${variantPart} × ${item.quantity} = ${item.unit_price * item.quantity} ج`
    );
  }

  lines.push(`\n💰 المجموع: ${order.subtotal} ج`);

  if (order.delivery_fee > 0) {
    lines.push(`🚚 رسوم التوصيل: ${order.delivery_fee} ج`);
  }

  if (order.discount_amount > 0) {
    lines.push(`🎁 خصم النقاط: ${order.discount_amount} ج`);
  }

  if (order.offer_discount > 0) {
    lines.push(`🏷️ خصم الكوبون: ${order.offer_discount} ج`);
  }

  lines.push(`✅ الإجمالي: ${order.total_price} ج`);

  if (order.points_earned > 0) {
    lines.push(`⭐ نقاط ستُضاف بعد التأكيد: ${order.points_earned} نقطة`);
  }

  if (order.notes) {
    lines.push(`📝 ملاحظات: ${order.notes}`);
  }

  return lines.join("\n");
}

/**
 * Build a WhatsApp deep-link URL.
 * Truncates item list if the final URL exceeds 2048 characters after encoding.
 */
export function buildWhatsAppURL(
  phone: string,
  message: string,
  orderCode?: string
): string {
  const base = `https://wa.me/${phone}?text=`;
  const encoded = encodeURIComponent(message);

  if (base.length + encoded.length <= MAX_URL_LENGTH) {
    return base + encoded;
  }

  // Truncate: append order code reference and re-encode
  const fallbackSuffix = orderCode
    ? `\n\nللتفاصيل: رقم الطلب ${orderCode}`
    : "";

  // L2: guard — if even the suffix alone doesn't fit, return base URL only
  const suffixEncoded = encodeURIComponent(fallbackSuffix);
  if (base.length + suffixEncoded.length > MAX_URL_LENGTH) {
    return base;
  }

  // Binary-search the message to fit within limit
  let low = 0;
  let high = message.length;
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2);
    const candidate =
      encodeURIComponent(message.slice(0, mid) + fallbackSuffix);
    if (base.length + candidate.length <= MAX_URL_LENGTH) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return base + encodeURIComponent(message.slice(0, low) + fallbackSuffix);
}
