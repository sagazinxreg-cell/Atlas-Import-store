/**
 * Camada de tipos do domínio Atlas Store.
 * Fonte única de verdade: tipos gerados do banco (Lovable Cloud).
 * Use estes aliases nos módulos (produtos, importações, vendas, metas...)
 * em vez de redeclarar tipos manualmente.
 */
import type { Database, Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

export type { Database, Tables, TablesInsert, TablesUpdate, Enums };

export type Profile = Tables<"profiles">;
export type Settings = Tables<"settings">;
export type Supplier = Tables<"suppliers">;
export type Product = Tables<"products">;
export type Importation = Tables<"importations">;
export type ImportationItem = Tables<"importation_items">;
export type Sale = Tables<"sales">;
export type SaleItem = Tables<"sale_items">;
export type Goal = Tables<"goals">;
export type Expense = Tables<"expenses">;
export type CurrencyRate = Tables<"currency_rates">;

export type ProductInsert = TablesInsert<"products">;
export type ProductUpdate = TablesUpdate<"products">;
export type SupplierInsert = TablesInsert<"suppliers">;
export type ImportationInsert = TablesInsert<"importations">;
export type ImportationItemInsert = TablesInsert<"importation_items">;
export type SaleInsert = TablesInsert<"sales">;
export type SaleItemInsert = TablesInsert<"sale_items">;
export type GoalInsert = TablesInsert<"goals">;
export type ExpenseInsert = TablesInsert<"expenses">;
export type CurrencyRateInsert = TablesInsert<"currency_rates">;
export type SettingsUpdate = TablesUpdate<"settings">;

export type ImportMethod = Enums<"import_method">;
export type ImportationStatus = Enums<"importation_status">;
export type GoalStatus = Enums<"goal_status">;
export type SaleChannel = Enums<"sale_channel">;

/** Campos calculados no banco — nunca escrever pelo frontend. */
export const SERVER_COMPUTED_FIELDS = {
  products: ["total_cost"],
  importations: ["total_cost"],
  importation_items: ["unit_total_cost", "line_total_cost"],
  sales: ["total_revenue", "total_cost", "gross_profit", "available_profit", "reinvestment_profit"],
  sale_items: ["line_revenue", "line_cost"],
} as const;

/** Divisão padrão do lucro (configurável em settings). */
export const DEFAULT_PROFIT_SPLIT = { available: 50, reinvestment: 50 } as const;
