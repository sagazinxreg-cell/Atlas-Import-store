import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Product, Sale, SaleChannel } from "@/lib/database";
import { DEFAULT_PROFIT_SPLIT } from "@/lib/database";

export type SaleWithProduct = Sale & {
  product?: Pick<Product, "id" | "name" | "brand" | "total_cost" | "sale_price"> | null;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Entre na sua conta para registrar vendas.");
  }
  return data.user.id;
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    retry: false,
    queryFn: async (): Promise<SaleWithProduct[]> => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, product:products(id, name, brand, total_cost, sale_price)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as SaleWithProduct[];
    },
  });
}

/** Percentuais configuráveis da regra Atlas Store (padrão 50/50). */
export function useProfitSplit() {
  return useQuery({
    queryKey: ["profit-split"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("available_profit_percentage, reinvestment_percentage")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return {
        available: Number(data?.available_profit_percentage ?? DEFAULT_PROFIT_SPLIT.available),
        reinvestment: Number(data?.reinvestment_percentage ?? DEFAULT_PROFIT_SPLIT.reinvestment),
      };
    },
  });
}

export function useSaleProducts() {
  return useQuery({
    queryKey: ["sale-products"],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, size, color, quantity, total_cost, sale_price")
        .order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

export type SaleFormPayload = {
  product_id: string | null;
  customer_name: string | null;
  channel: SaleChannel;
  date: string;
  quantity: number;
  sale_price: number;
  payment_fee: number;
  other_costs: number;
  notes: string | null;
};

export function useSaveSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: SaleFormPayload }) => {
      if (id) {
        const { error } = await supabase.from("sales").update(values).eq("id", id);
        if (error) throw new Error(error.message);
        return;
      }
      const user_id = await requireUserId();
      const { error } = await supabase.from("sales").insert({ ...values, user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
