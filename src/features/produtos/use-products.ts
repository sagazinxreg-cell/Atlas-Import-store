import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductInsert, Supplier } from "@/lib/database";

export type ProductWithSupplier = Product & { supplier?: Pick<Supplier, "id" | "name"> | null };

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Entre na sua conta para gerenciar produtos.");
  }
  return data.user.id;
}

async function fetchProducts(): Promise<ProductWithSupplier[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, supplier:suppliers(id, name)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductWithSupplier[];
}

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: fetchProducts, retry: false });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    retry: false,
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
}

/** Cria (ou reaproveita) um fornecedor pelo nome digitado. */
async function resolveSupplierId(name: string, country: string | null): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const { data: existing, error: findError } = await supabase
    .from("suppliers")
    .select("id")
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return existing.id;

  const user_id = await requireUserId();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({ user_id, name: trimmed, country })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export type ProductFormPayload = Omit<ProductInsert, "user_id" | "supplier_id" | "total_cost"> & {
  supplierName: string;
};

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id?: string | undefined; values: ProductFormPayload }) => {
      const { supplierName, ...rest } = values;
      const supplier_id = await resolveSupplierId(supplierName, rest.country ?? null);

      if (id) {
        const { error } = await supabase
          .from("products")
          .update({ ...rest, supplier_id })
          .eq("id", id);
        if (error) throw new Error(error.message);
        return;
      }

      const user_id = await requireUserId();
      const { error } = await supabase.from("products").insert({ ...rest, supplier_id, user_id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
