export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      buyers: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          name: string
          phone: string
          producer_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          name: string
          phone: string
          producer_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          name?: string
          phone?: string
          producer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyers_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          intermediary_price: number | null
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit: string
          unit_price: number
        }
        Insert: {
          id?: string
          intermediary_price?: number | null
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit: string
          unit_price: number
        }
        Update: {
          id?: string
          intermediary_price?: number | null
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          buyer_id: string
          created_at: string
          delivered_at: string | null
          delivery_date: string
          delivery_time: string
          device_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_status: string
          producer_id: string
          source: string
          status: string
          total: number
          tracking_token: string
        }
        Insert: {
          accepted_at?: string | null
          buyer_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_date: string
          delivery_time: string
          device_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string
          producer_id: string
          source?: string
          status?: string
          total?: number
          tracking_token: string
        }
        Update: {
          accepted_at?: string | null
          buyer_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_date?: string
          delivery_time?: string
          device_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string
          producer_id?: string
          source?: string
          status?: string
          total?: number
          tracking_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      producers: {
        Row: {
          active: boolean
          created_at: string
          id: string
          municipality: string | null
          name: string
          phone: string | null
          pix_key: string | null
          slug: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          municipality?: string | null
          name: string
          phone?: string | null
          pix_key?: string | null
          slug: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          municipality?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          id: string
          intermediary_price: number | null
          name: string
          price: number
          producer_id: string
          unit: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          intermediary_price?: number | null
          name: string
          price: number
          producer_id: string
          unit: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          intermediary_price?: number | null
          name?: string
          price?: number
          producer_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          producer_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          producer_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          producer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          audio_seconds: number | null
          cost_brl: number
          created_at: string
          device_id: string | null
          id: string
          kind: string
          model: string | null
          producer_id: string | null
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          audio_seconds?: number | null
          cost_brl?: number
          created_at?: string
          device_id?: string | null
          id?: string
          kind: string
          model?: string | null
          producer_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          audio_seconds?: number | null
          cost_brl?: number
          created_at?: string
          device_id?: string | null
          id?: string
          kind?: string
          model?: string | null
          producer_id?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owned_producer_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
