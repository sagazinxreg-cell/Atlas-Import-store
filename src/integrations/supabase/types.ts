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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      currency_rates: {
        Row: {
          created_at: string
          currency: string
          id: string
          rate: number
          reference_date: string
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          rate: number
          reference_date?: string
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          rate?: number
          reference_date?: string
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          description: string
          id: string
          importation_id: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          importation_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          importation_id?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_importation_id_fkey"
            columns: ["importation_id"]
            isOneToOne: false
            referencedRelation: "importations"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          average_ticket: number
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          average_ticket?: number
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          average_ticket?: number
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      importation_items: {
        Row: {
          allocated_import_cost: number
          created_at: string
          description: string | null
          id: string
          importation_id: string
          line_total_cost: number
          product_id: string | null
          quantity: number
          unit_price_converted: number
          unit_price_original: number
          unit_total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allocated_import_cost?: number
          created_at?: string
          description?: string | null
          id?: string
          importation_id: string
          line_total_cost?: number
          product_id?: string | null
          quantity?: number
          unit_price_converted?: number
          unit_price_original?: number
          unit_total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allocated_import_cost?: number
          created_at?: string
          description?: string | null
          id?: string
          importation_id?: string
          line_total_cost?: number
          product_id?: string | null
          quantity?: number
          unit_price_converted?: number
          unit_price_original?: number
          unit_total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "importation_items_importation_id_fkey"
            columns: ["importation_id"]
            isOneToOne: false
            referencedRelation: "importations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "importation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      importations: {
        Row: {
          created_at: string
          currency: string
          exchange_rate: number
          fees: number
          id: string
          insurance: number
          method: Database["public"]["Enums"]["import_method"]
          notes: string | null
          ordered_at: string | null
          origin_country: string | null
          product_total: number
          received_at: string | null
          reference: string | null
          shipping_cost: number
          status: Database["public"]["Enums"]["importation_status"]
          supplier: string | null
          supplier_id: string | null
          taxes: number
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          exchange_rate?: number
          fees?: number
          id?: string
          insurance?: number
          method?: Database["public"]["Enums"]["import_method"]
          notes?: string | null
          ordered_at?: string | null
          origin_country?: string | null
          product_total?: number
          received_at?: string | null
          reference?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["importation_status"]
          supplier?: string | null
          supplier_id?: string | null
          taxes?: number
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          exchange_rate?: number
          fees?: number
          id?: string
          insurance?: number
          method?: Database["public"]["Enums"]["import_method"]
          notes?: string | null
          ordered_at?: string | null
          origin_country?: string | null
          product_total?: number
          received_at?: string | null
          reference?: string | null
          shipping_cost?: number
          status?: Database["public"]["Enums"]["importation_status"]
          supplier?: string | null
          supplier_id?: string | null
          taxes?: number
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "importations_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          country: string | null
          created_at: string
          id: string
          image: string | null
          import_cost: number
          import_method: Database["public"]["Enums"]["import_method"] | null
          importation_id: string | null
          name: string
          notes: string | null
          purchase_price: number
          quantity: number
          sale_price: number
          size: string | null
          sku: string | null
          supplier_id: string | null
          total_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: string | null
          country?: string | null
          created_at?: string
          id?: string
          image?: string | null
          import_cost?: number
          import_method?: Database["public"]["Enums"]["import_method"] | null
          importation_id?: string | null
          name: string
          notes?: string | null
          purchase_price?: number
          quantity?: number
          sale_price?: number
          size?: string | null
          sku?: string | null
          supplier_id?: string | null
          total_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: string | null
          country?: string | null
          created_at?: string
          id?: string
          image?: string | null
          import_cost?: number
          import_method?: Database["public"]["Enums"]["import_method"] | null
          importation_id?: string | null
          name?: string
          notes?: string | null
          purchase_price?: number
          quantity?: number
          sale_price?: number
          size?: string | null
          sku?: string | null
          supplier_id?: string | null
          total_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_importation_id_fkey"
            columns: ["importation_id"]
            isOneToOne: false
            referencedRelation: "importations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          base_currency: string
          created_at: string
          display_name: string | null
          id: string
          store_name: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          display_name?: string | null
          id: string
          store_name?: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          display_name?: string | null
          id?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          line_cost: number
          line_revenue: number
          product_id: string | null
          quantity: number
          sale_id: string
          unit_cost: number
          unit_sale_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_cost?: number
          line_revenue?: number
          product_id?: string | null
          quantity?: number
          sale_id: string
          unit_cost?: number
          unit_sale_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          line_cost?: number
          line_revenue?: number
          product_id?: string | null
          quantity?: number
          sale_id?: string
          unit_cost?: number
          unit_sale_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          available_profit: number
          channel: Database["public"]["Enums"]["sale_channel"]
          created_at: string
          customer_name: string | null
          date: string
          gross_profit: number
          id: string
          notes: string | null
          other_costs: number
          payment_fee: number
          product_id: string | null
          quantity: number
          reinvestment_profit: number
          sale_price: number
          total_cost: number
          total_revenue: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_profit?: number
          channel?: Database["public"]["Enums"]["sale_channel"]
          created_at?: string
          customer_name?: string | null
          date?: string
          gross_profit?: number
          id?: string
          notes?: string | null
          other_costs?: number
          payment_fee?: number
          product_id?: string | null
          quantity?: number
          reinvestment_profit?: number
          sale_price?: number
          total_cost?: number
          total_revenue?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_profit?: number
          channel?: Database["public"]["Enums"]["sale_channel"]
          created_at?: string
          customer_name?: string | null
          date?: string
          gross_profit?: number
          id?: string
          notes?: string | null
          other_costs?: number
          payment_fee?: number
          product_id?: string | null
          quantity?: number
          reinvestment_profit?: number
          sale_price?: number
          total_cost?: number
          total_revenue?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          available_profit_percentage: number
          cny_exchange_rate: number
          created_at: string
          default_markup_percentage: number
          icms_percentage: number
          id: string
          import_tax_percentage: number
          other_fees_percentage: number
          payment_fee_percentage: number
          reinvestment_percentage: number
          updated_at: string
          usd_exchange_rate: number
          user_id: string
        }
        Insert: {
          available_profit_percentage?: number
          cny_exchange_rate?: number
          created_at?: string
          default_markup_percentage?: number
          icms_percentage?: number
          id?: string
          import_tax_percentage?: number
          other_fees_percentage?: number
          payment_fee_percentage?: number
          reinvestment_percentage?: number
          updated_at?: string
          usd_exchange_rate?: number
          user_id: string
        }
        Update: {
          available_profit_percentage?: number
          cny_exchange_rate?: number
          created_at?: string
          default_markup_percentage?: number
          icms_percentage?: number
          id?: string
          import_tax_percentage?: number
          other_fees_percentage?: number
          payment_fee_percentage?: number
          reinvestment_percentage?: number
          updated_at?: string
          usd_exchange_rate?: number
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact: string | null
          country: string | null
          created_at: string
          default_import_method:
            | Database["public"]["Enums"]["import_method"]
            | null
          id: string
          name: string
          notes: string | null
          platform: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          contact?: string | null
          country?: string | null
          created_at?: string
          default_import_method?:
            | Database["public"]["Enums"]["import_method"]
            | null
          id?: string
          name: string
          notes?: string | null
          platform?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          contact?: string | null
          country?: string | null
          created_at?: string
          default_import_method?:
            | Database["public"]["Enums"]["import_method"]
            | null
          id?: string
          name?: string
          notes?: string | null
          platform?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_status: "active" | "completed" | "cancelled"
      import_method: "uscloser" | "cssbuy" | "direct" | "other"
      importation_status:
        | "draft"
        | "ordered"
        | "in_transit"
        | "customs"
        | "received"
        | "cancelled"
      sale_channel:
        | "instagram"
        | "whatsapp"
        | "marketplace"
        | "in_person"
        | "other"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      goal_status: ["active", "completed", "cancelled"],
      import_method: ["uscloser", "cssbuy", "direct", "other"],
      importation_status: [
        "draft",
        "ordered",
        "in_transit",
        "customs",
        "received",
        "cancelled",
      ],
      sale_channel: [
        "instagram",
        "whatsapp",
        "marketplace",
        "in_person",
        "other",
      ],
    },
  },
} as const
