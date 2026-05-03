export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          image_url: string | null
          order_index: number
          is_visible: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          image_url?: string | null
          order_index?: number
          is_visible?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string | null
          image_url?: string | null
          order_index?: number
          is_visible?: boolean
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          description: string | null
          base_price: number | null
          image_url: string | null
          is_available: boolean
          cta_type: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          description?: string | null
          base_price?: number | null
          image_url?: string | null
          is_available?: boolean
          cta_type?: string
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          description?: string | null
          base_price?: number | null
          image_url?: string | null
          is_available?: boolean
          cta_type?: string
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          variant_name: string
          price: number
          is_available: boolean
          order_index: number
        }
        Insert: {
          id?: string
          product_id: string
          variant_name: string
          price: number
          is_available?: boolean
          order_index?: number
        }
        Update: {
          id?: string
          product_id?: string
          variant_name?: string
          price?: number
          is_available?: boolean
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          auth_id: string
          phone_number: string
          name: string | null
          default_address: string | null
          points_balance: number
          created_at: string
        }
        Insert: {
          id?: string
          auth_id: string
          phone_number: string
          name?: string | null
          default_address?: string | null
          points_balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          auth_id?: string
          phone_number?: string
          name?: string | null
          default_address?: string | null
          points_balance?: number
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_code: string
          user_id: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          order_type: string
          zone_id: string | null
          notes: string | null
          status: string
          subtotal: number
          delivery_fee: number
          discount_amount: number
          offer_discount: number
          coupon_id: string | null
          total_price: number
          points_used: number
          points_earned: number
          points_status: string
          whatsapp_opened: boolean
          guest_token: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_code?: string
          user_id?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          order_type: string
          zone_id?: string | null
          notes?: string | null
          status?: string
          subtotal: number
          delivery_fee?: number
          discount_amount?: number
          offer_discount?: number
          coupon_id?: string | null
          total_price: number
          points_used?: number
          points_earned?: number
          points_status?: string
          whatsapp_opened?: boolean
          guest_token?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_code?: string
          user_id?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          order_type?: string
          zone_id?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          delivery_fee?: number
          discount_amount?: number
          offer_discount?: number
          coupon_id?: string | null
          total_price?: number
          points_used?: number
          points_earned?: number
          points_status?: string
          whatsapp_opened?: boolean
          guest_token?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          variant_name: string | null
          unit_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          variant_name?: string | null
          unit_price: number
          quantity?: number
          subtotal: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name?: string
          variant_name?: string | null
          unit_price?: number
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      delivery_zones: {
        Row: {
          id: string
          zone_name: string
          fee: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          zone_name: string
          fee: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          zone_name?: string
          fee?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          transaction_type: string
          points: number
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          transaction_type: string
          points: number
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string | null
          transaction_type?: string
          points?: number
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      offers: {
        Row: {
          id: string
          title: string | null
          image_url: string | null
          expires_at: string | null
          is_active: boolean
          order_index: number
          benefit_type: string
          benefit_value: number
          coupon_code: string | null
          min_order_amount: number
          max_uses: number | null
          uses_count: number
          created_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          image_url?: string | null
          expires_at?: string | null
          is_active?: boolean
          order_index?: number
          benefit_type?: string
          benefit_value?: number
          coupon_code?: string | null
          min_order_amount?: number
          max_uses?: number | null
          uses_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string | null
          image_url?: string | null
          expires_at?: string | null
          is_active?: boolean
          order_index?: number
          benefit_type?: string
          benefit_value?: number
          coupon_code?: string | null
          min_order_amount?: number
          max_uses?: number | null
          uses_count?: number
          created_at?: string
        }
        Relationships: []
      }
      offer_products: {
        Row: {
          id: string
          offer_id: string
          product_id: string | null
          variant_id: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          product_id?: string | null
          variant_id?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          product_id?: string | null
          variant_id?: string | null
          order_index?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_products_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_products_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          }
        ]
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_order_with_points: {
        Args: {
          p_user_id: string
          p_points_to_use: number
          p_subtotal: number
          p_delivery_fee: number
          p_discount: number
          p_total: number
          p_order_data: Json
          p_items: Json
          p_coupon_id?: string | null
          p_offer_discount?: number
          p_bonus_points?: number
        }
        Returns: string
      }
      admin_adjust_points: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: string
          p_note?: string
        }
        Returns: void
      }
      increment_coupon_uses: {
        Args: { p_coupon_id: string }
        Returns: void
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
