import { useEffect, useMemo, useState } from "react";
import { Calculator, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, formatPercent } from "@/lib/format";
import type { ImportMethod } from "@/lib/database";
import {
  IMPORT_METHODS,
  IMPORT_METHOD_LABELS,
  PRODUCT_CATEGORIES,
  calculateMargin,
  calculateProductCost,
} from "./cost";
import { useSaveProduct, type ProductWithSupplier } from "./use-products";

function toNumber(value: string): number {
  const clean = value.replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

type FormState = {
  name: string;
  brand: string;
  category: string;
  size: string;
  color: string;
  supplierName: string;
  country: string;
  importMethod: ImportMethod | "";
  productTotal: string;
  shipping: string;
  taxes: string;
  fees: string;
  otherCosts: string;
  salePrice: string;
  quantity: string;
  image: string;
  notes: string;
};

const emptyForm: FormState = {
  name: "",
  brand: "",
  category: "",
  size: "",
  color: "",
  supplierName: "",
  country: "",
  importMethod: "",
  productTotal: "",
  shipping: "",
  taxes: "",
  fees: "",
  otherCosts: "",
  salePrice: "",
  quantity: "1",
  image: "",
  notes: "",
};

function fromProduct(product: ProductWithSupplier): FormState {
  const quantity = Math.max(1, Number(product.quantity ?? 1));
  return {
    name: product.name ?? "",
    brand: product.brand ?? "",
    category: product.category ?? "",
    size: product.size ?? "",
    color: product.color ?? "",
    supplierName: product.supplier?.name ?? "",
    country: product.country ?? "",
    importMethod: (product.import_method as ImportMethod | null) ?? "",
    productTotal: String(Number(product.purchase_price ?? 0) * quantity),
    shipping: String(Number(product.import_cost ?? 0) * quantity),
    taxes: "",
    fees: "",
    otherCosts: "",
    salePrice: String(Number(product.sale_price ?? 0)),
    quantity: String(quantity),
    image: product.image ?? "",
    notes: product.notes ?? "",
  };
}

function MoneyField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <div className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-input bg-background/60">
        <span className="grid place-items-center border-r border-input px-2.5 text-xs font-semibold text-muted-foreground">
          R$
        </span>
        <Input
          value={value}
          inputMode="decimal"
          placeholder="0,00"
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-none border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  suppliers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithSupplier | null;
  suppliers: string[];
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const save = useSaveProduct();

  useEffect(() => {
    if (!open) return;
    setForm(product ? fromProduct(product) : emptyForm);
  }, [open, product]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const cost = useMemo(
    () =>
      calculateProductCost({
        productTotal: toNumber(form.productTotal),
        shipping: toNumber(form.shipping),
        taxes: toNumber(form.taxes),
        fees: toNumber(form.fees),
        otherCosts: toNumber(form.otherCosts),
        quantity: toNumber(form.quantity),
      }),
    [form],
  );

  const margin = calculateMargin(cost.totalCostPerUnit, toNumber(form.salePrice));

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    try {
      await save.mutateAsync({
        id: product?.id,
        values: {
          name: form.name.trim(),
          brand: form.brand.trim() || null,
          category: form.category || null,
          size: form.size.trim() || null,
          color: form.color.trim() || null,
          country: form.country.trim() || null,
          import_method: form.importMethod ? (form.importMethod as ImportMethod) : null,
          purchase_price: cost.purchasePricePerUnit,
          import_cost: cost.importCostPerUnit,
          sale_price: toNumber(form.salePrice),
          quantity: cost.quantity,
          image: form.image.trim() || null,
          notes: form.notes.trim() || null,
          supplierName: form.supplierName,
        },
      });
      toast.success(product ? "Produto atualizado." : "Produto cadastrado.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o produto.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Informe os custos do lote inteiro. O custo por peça é calculado com rateio dos custos
            compartilhados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold">Nome *</Label>
              <Input
                className="mt-1.5 h-10"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex.: Camiseta Nike Tech"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Marca</Label>
              <Input
                className="mt-1.5 h-10"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Categoria</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Tamanho</Label>
              <Input
                className="mt-1.5 h-10"
                value={form.size}
                onChange={(e) => set("size", e.target.value)}
                placeholder="M, 42..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Cor</Label>
              <Input
                className="mt-1.5 h-10"
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Fornecedor</Label>
              <Input
                className="mt-1.5 h-10"
                list="atlas-suppliers"
                value={form.supplierName}
                onChange={(e) => set("supplierName", e.target.value)}
                placeholder="Ex.: CSSBuy Agent"
              />
              <datalist id="atlas-suppliers">
                {suppliers.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label className="text-xs font-semibold">País de origem</Label>
              <Input
                className="mt-1.5 h-10"
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="EUA, China..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Método de importação</Label>
              <Select
                value={form.importMethod}
                onValueChange={(v) => set("importMethod", v as ImportMethod)}
              >
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {IMPORT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {IMPORT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Quantidade de peças</Label>
              <Input
                className="mt-1.5 h-10"
                inputMode="numeric"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-surface/40 p-4">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Custo real do lote</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha os valores totais do lote. Frete, impostos, taxas e outros custos são
              rateados entre as peças.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MoneyField
                label="Custo dos produtos"
                value={form.productTotal}
                onChange={(v) => set("productTotal", v)}
              />
              <MoneyField label="Frete" value={form.shipping} onChange={(v) => set("shipping", v)} />
              <MoneyField label="Impostos" value={form.taxes} onChange={(v) => set("taxes", v)} />
              <MoneyField label="Taxas" value={form.fees} onChange={(v) => set("fees", v)} />
              <MoneyField
                label="Outros custos"
                value={form.otherCosts}
                onChange={(v) => set("otherCosts", v)}
              />
              <MoneyField
                label="Preço de venda (por peça)"
                value={form.salePrice}
                onChange={(v) => set("salePrice", v)}
              />
            </div>

            <div className="mt-4 space-y-1.5">
              {cost.breakdown.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground"
                >
                  <span>{row.label}</span>
                  <span className="font-medium text-foreground">
                    {formatBRL(row.value)}{" "}
                    <span className="text-muted-foreground">({formatBRL(row.perUnit)}/peça)</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="label-caps">Custo total</p>
                <p className="mt-1 text-lg font-bold">{formatBRL(cost.totalCost)}</p>
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
                <p className="label-caps">Custo por peça</p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {formatBRL(cost.totalCostPerUnit)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="label-caps">Lucro por peça</p>
                <p className="mt-1 text-lg font-bold">
                  {formatBRL(margin.profit)}{" "}
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatPercent(margin.marginPercent, 1)}
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Custo total = produtos + frete + impostos + taxas + outros custos. O custo por peça é
              o custo total dividido por {cost.quantity} peça(s).
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Foto (URL)</Label>
              <Input
                className="mt-1.5 h-10"
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Observações</Label>
              <Textarea
                className="mt-1.5 min-h-10"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {product ? "Salvar alterações" : "Cadastrar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
