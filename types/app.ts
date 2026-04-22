// Application types for مطعم خلدون

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  image_url: string | null;
  order_index: number;
  is_visible: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  image_url: string | null;
  is_available: boolean;
  cta_type: "add_to_cart" | "whatsapp_inquiry";
  order_index: number;
  created_at: string;
  product_variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  price: number;
  is_available: boolean;
  order_index: number;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  variant_id: string | null;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  image_url: string | null;
}

export interface DeliveryZone {
  id: string;
  zone_name: string;
  fee: number;
  is_active: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  order_type: "delivery" | "pickup";
  zone_id: string | null;
  notes: string | null;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  offer_discount: number;
  coupon_id: string | null;
  total_price: number;
  points_used: number;
  points_earned: number;
  points_status: "pending" | "confirmed" | "cancelled";
  whatsapp_opened: boolean;
  guest_token: string | null;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  order_id: string | null;
  transaction_type:
    | "earned"
    | "redeemed"
    | "manual_add"
    | "manual_deduct"
    | "refunded"
    | "reversed";
  points: number;
  note: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  title: string | null;
  image_url: string | null;
  expires_at: string | null;
  is_active: boolean;
  order_index: number;
  // benefit
  benefit_type: "display_only" | "discount_pct" | "discount_fixed" | "points_multiplier" | "coupon_pct" | "coupon_fixed";
  benefit_value: number;
  coupon_code: string | null;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  created_at: string;
  offer_products?: OfferProduct[];
}

export interface OfferProduct {
  id: string;
  offer_id: string;
  product_id: string | null;
  order_index: number;
  products: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
}

/** Lightweight type passed to ProductCard to show badges + discounted price */
export interface ActiveProductOffer {
  offerId: string;
  type: "discount_pct" | "discount_fixed" | "points_multiplier";
  value: number;
}

export interface User {
  id: string;
  auth_id: string;
  phone_number: string;
  name: string | null;
  default_address: string | null;
  points_balance: number;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Settings {
  whatsapp_order_number: string;
  whatsapp_social_url: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  phone_1: string;
  phone_2: string;
  phone_3: string;
  restaurant_address: string;
  delivery_enabled: string;
  pickup_enabled: string;
  points_per_100_egp: string;
  point_value_egp: string;
  max_points_discount_pct: string;
  stat_customers: string;
  stat_years: string;
  working_hours: string;
  is_ordering_open: string;
  // Homepage redesign extras
  stat_followers: string;
  stat_delivery_time: string;
  stat_rating: string;
  stat_branches: string;
  established_year: string;
  brand_story: string;
  hero_video_url: string;
}
