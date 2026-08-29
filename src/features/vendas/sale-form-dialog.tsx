import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import type { SaleChannel } from "@/lib/database";
import { SALE_CHANNELS, SALE_CHANNEL_LABELS, calculateSale } from "./sale-math";
import { useSaleProducts, useSaveSale, type SaleWithProduct } from "./use-sales";

function toNumber(value: string): number {
  const clean = value.replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const NO_PRODUCT = "__none__";

type FormState = {
  productId: string;
  customerName: string;
  channel: SaleChannel;
  date: string;
  quantity: string;
  salePrice: string;
  unitCost: string;
  paymentFee: string;
  otherCosts: string;
  notes: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): FormState => ({
  productId: NO_PRODUCT,
  customerName: "",
  channel: "other",
  date: today(),
  quantity: "1",
  salePrice: "",
  unitCost: "",
  paymentFee: "",
  otherCosts: "",
  notes: "",
});

function MoneyField({
  label,
  value,
  onChange,
  hint,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  hint?: string;
  readOnly?: boolean;
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
          readOnly={readOnly}
          onChange={(event) => onChange?.(event.target.value)}
          className="h-10 rounded-none border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
        />
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SaleFormDialog({
  open,
  onOpenChange,
  sale,
  availablePercentage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: SaleWithProduct | null;
  availablePercentage: number;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const products = useSaleProducts();
  const save = useSaveSale();

  useEffect(() => {
    if (!open) return;
    setForm(
      sale
        ? {
            productId: sale.product_id ?? NO_PRODUCT,
            customerName: sale.customer_name ?? "",
            channel: sale.channel,
            date: String(sale.date ?? today()).slice(0, 10),
            quantity: String(sale.quantity ?? 1),
            salePrice: String(Number(sale.sale_price ?? 0)),
            unitCost: String(Number(sale.product?.total_cost ?? 0)),
            paymentFee: String(Number(sale.payment_fee ?? 0)),
            otherCosts: String(Number(sale.other_costs ?? 0)),
            notes: sale.notes ?? "",
          }
        : emptyForm(),
    );
  }, [open, sale]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function selectProduct(productId: string) {
    const product = (products.data ?? []).find((item) => item.id === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      unitCost: product ? String(Number(product.total_cost ?? 0)) : prev.unitCost,
      salePrice:
        product && Number(product.sale_price ?? 0) > 0
          ? String(Number(product.sale_price))
          : prev.salePrice,
    }));
  }

  const result = useMemo(
    () =>
      calculateSale({
        salePrice: toNumber(form.salePrice),
        quantity: toNumber(form.quantity),
        unitCost: toNumber(form.unitCost),
        paymentFee: toNumber(form.paymentFee),
        otherCosts: toNumber(form.otherCosts),
        availablePercentage,
      }),
    [form, availablePercentage],
  );

  async function handleSubmit() {
    if (toNumber(form.salePrice) <= 0) {
      toast.error("Informe o preço de venda.");
      return;
    }
    try {
      await save.mutateAsync({
        id: sale?.id,
        values: {
          product_id: form.productId === NO_PRODUCT ? null : form.productId,
          customer_name: form.customerName.trim() || null,
          channel: form.channel,
          date: form.date || today(),
          quantity: result.quantity,
          sale_price: toNumber(form.salePrice),
          payment_fee: toNumber(form.paymentFee),
          other_costs: toNumber(form.otherCosts),
          notes: form.notes.trim() || null,
        },
      });
      toast.success(sale ? "Venda atualizada." : "Venda registrada.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a venda.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{sale ? "Editar venda" : "Nova venda"}</DialogTitle>
          <DialogDescription>
            O custo real vem do produto. A taxa de pagamento é descontada antes do lucro final.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold">Produto</Label>
            <Select value={form.productId} onValueChange={selectProduct}>
              <SelectTrigger className="mt-1.5 h-10">
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PRODUCT}>Sem produto vinculado</SelectItem>
                {(products.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                    {product.brand ? ` · ${product.brand}` : ""} ·{" "}
                    {formatBRL(Number(product.total_cost ?? 0))}/peça
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Quantidade</Label>
            <Input
              className="mt-1.5 h-10 font-semibold"
              inputMode="numeric"
              value={form.quantity}
              onChange={(event) => set("quantity", event.target.value)}
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Data</Label>
            <Input
              className="mt-1.5 h-10"
              type="date"
              value={form.date}
              onChange={(event) => set("date", event.target.value)}
            />
          </div>

          <MoneyField
            label="Preço de venda (por peça)"
            value={form.salePrice}
            onChange={(value) => set("salePrice", value)}
          />
          <MoneyField
            label="Custo real (por peça)"
            value={form.unitCost}
            onChange={(value) => set("unitCost", value)}
            hint="Preenchido pelo produto selecionado."
          />
          <MoneyField
            label="Taxa de pagamento"
            value={form.paymentFee}
            onChange={(value) => set("paymentFee", value)}
            hint="Maquininha, gateway, parcelamento."
          />
          <MoneyField
            label="Outros custos"
            value={form.otherCosts}
            onChange={(value) => set("otherCosts", value)}
            hint="Frete ao cliente, embalagem, brindes."
          />

          <div>
            <Label className="text-xs font-semibold">Cliente</Label>
            <Input
              className="mt-1.5 h-10"
              value={form.customerName}
              onChange={(event) => set("customerName", event.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Canal</Label>
            <Select value={form.channel} onValueChange={(value) => set("channel", value as SaleChannel)}>
              <SelectTrigger className="mt-1.5 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALE_CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {SALE_CHANNEL_LABELS[channel]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold">Observações</Label>
            <Textarea
              className="mt-1.5"
              rows={2}
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>
        </div>

        <SaleResultBlock result={result} />

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending && <Loader2 className="size-4 animate-spin" />}
            {sale ? "Salvar alterações" : "Registrar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SaleResultBlock({ result }: { result: ReturnType<typeof calculateSale> }) {
  return (
    <section className="surface-card rounded-xl p-4">
      <p className="label-caps">Resultado da venda</p>

      <dl className="mt-3 space-y-2 text-sm">
        <Line label="Preço de venda" value={formatBRL(result.revenue)} />
        <Line label="Custo dos produtos" value={`- ${formatBRL(result.productCost)}`} />
        <Line label="Taxa de pagamento" value={`- ${formatBRL(result.paymentFee)}`} />
        <Line label="Outros custos" value={`- ${formatBRL(result.otherCosts)}`} />
        <Line label="Custo total" value={formatBRL(result.totalCost)} strong />
      </dl>

      {result.isLoss ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3">
          <AlertTriangle className="mt-0.5 size-4 text-destructive" />
          <div>
            <p className="text-sm font-bold text-destructive">⚠️ PREJUÍZO</p>
            <p className="text-xs text-muted-foreground">
              O custo total supera a receita em {formatBRL(Math.abs(result.profit))}. Nada é
              classificado como lucro, disponível ou reinvestimento.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <ResultCard label="Lucro" value={formatBRL(result.profit)} emphasis />
          <ResultCard
            label={`Disponível (${formatPercent(result.availablePercentage)})`}
            value={formatBRL(result.availableProfit)}
          />
          <ResultCard
            label={`Reinvestimento (${formatPercent(result.reinvestmentPercentage)})`}
            value={formatBRL(result.reinvestmentProfit)}
          />
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground">
        Faturamento não é lucro: lucro = receita − custo real − taxa de pagamento − outros custos.
      </p>
    </section>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={strong ? "font-bold" : "font-semibold"}>{value}</dd>
    </div>
  );
}

function ResultCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <p className="label-caps">{label}</p>
      <p className={`mt-1 text-lg font-bold ${emphasis ? "text-primary" : ""}`}>{value}</p>
    </div>
  );
}
