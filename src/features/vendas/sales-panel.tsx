import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Search, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import { SALE_CHANNEL_LABELS, calculateSale } from "./sale-math";
import { SaleFormDialog } from "./sale-form-dialog";
import {
  useDeleteSale,
  useProfitSplit,
  useSales,
  type SaleWithProduct,
} from "./use-sales";

export function SalesPanel() {
  const sales = useSales();
  const split = useProfitSplit();
  const remove = useDeleteSale();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SaleWithProduct | null>(null);
  const [search, setSearch] = useState("");

  const availablePercentage = split.data?.available ?? 50;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (sales.data ?? []).filter((sale) => {
      if (!term) return true;
      return [sale.product?.name, sale.product?.brand, sale.customer_name, sale.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [sales.data, search]);

  const totals = useMemo(() => {
    return (sales.data ?? []).reduce(
      (acc, sale) => {
        acc.revenue += Number(sale.total_revenue ?? 0);
        acc.profit += Number(sale.gross_profit ?? 0);
        acc.available += Number(sale.available_profit ?? 0);
        acc.reinvestment += Number(sale.reinvestment_profit ?? 0);
        acc.pieces += Number(sale.quantity ?? 0);
        return acc;
      },
      { revenue: 0, profit: 0, available: 0, reinvestment: 0, pieces: 0 },
    );
  }, [sales.data]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  async function handleDelete(sale: SaleWithProduct) {
    try {
      await remove.mutateAsync(sale.id);
      toast.success("Venda removida.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Financeiro"
        title="Vendas"
        description={`Cada venda com receita, custo real, lucro e a divisão ${formatPercent(availablePercentage)} disponível / ${formatPercent(100 - availablePercentage)} reinvestimento.`}
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Nova venda
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Faturamento" value={formatBRL(totals.revenue)} />
        <SummaryCard
          label={totals.profit < 0 ? "Prejuízo acumulado" : "Lucro"}
          value={formatBRL(totals.profit)}
          emphasis={totals.profit >= 0}
          danger={totals.profit < 0}
        />
        <SummaryCard label="Disponível" value={formatBRL(totals.available)} />
        <SummaryCard label="Reinvestimento" value={formatBRL(totals.reinvestment)} />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {formatNumber(totals.pieces)} peça(s) vendida(s). Faturamento não é lucro — o lucro já
        desconta custo real, taxa de pagamento e outros custos.
      </p>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-10 pl-9"
          placeholder="Buscar por produto, cliente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mt-5 space-y-3">
        {sales.isLoading && (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        )}

        {sales.isError && (
          <EmptyState
            title="Não foi possível carregar as vendas"
            description={
              sales.error instanceof Error ? sales.error.message : "Tente novamente em instantes."
            }
          />
        )}

        {sales.isSuccess && rows.length === 0 && (
          <EmptyState
            title="Nenhuma venda registrada ainda"
            description="Registre sua primeira venda para acompanhar lucro, valor disponível e reinvestimento."
            action={
              <Button onClick={openNew}>
                <Plus className="size-4" />
                Nova venda
              </Button>
            }
          />
        )}

        {rows.map((sale) => (
          <SaleRow
            key={sale.id}
            sale={sale}
            availablePercentage={availablePercentage}
            onEdit={() => {
              setEditing(sale);
              setDialogOpen(true);
            }}
            onDelete={() => handleDelete(sale)}
          />
        ))}
      </div>

      <SaleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sale={editing}
        availablePercentage={availablePercentage}
      />
    </>
  );
}

function SaleRow({
  sale,
  availablePercentage,
  onEdit,
  onDelete,
}: {
  sale: SaleWithProduct;
  availablePercentage: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const revenue = Number(sale.total_revenue ?? 0);
  const totalCost = Number(sale.total_cost ?? 0);
  const profit = Number(sale.gross_profit ?? 0);
  const isLoss = profit < 0;

  const fallback = calculateSale({
    salePrice: Number(sale.sale_price ?? 0),
    quantity: Number(sale.quantity ?? 1),
    unitCost: Number(sale.product?.total_cost ?? 0),
    paymentFee: Number(sale.payment_fee ?? 0),
    otherCosts: Number(sale.other_costs ?? 0),
    availablePercentage,
  });

  const available = isLoss ? 0 : Number(sale.available_profit ?? fallback.availableProfit);
  const reinvestment = isLoss ? 0 : Number(sale.reinvestment_profit ?? fallback.reinvestmentProfit);

  return (
    <article className="surface-card rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">
            {sale.product?.name ?? "Venda avulsa"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(`${String(sale.date).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR")} ·{" "}
            {SALE_CHANNEL_LABELS[sale.channel] ?? sale.channel} · {formatNumber(Number(sale.quantity ?? 0))}{" "}
            peça(s)
            {sale.customer_name ? ` · ${sale.customer_name}` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar venda">
            <Pencil className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Excluir venda">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Cell label="Preço de venda" value={formatBRL(revenue)} />
        <Cell label="Custo" value={formatBRL(totalCost)} />
        <Cell
          label={isLoss ? "Prejuízo" : "Lucro"}
          value={formatBRL(profit)}
          tone={isLoss ? "danger" : "primary"}
        />
        <Cell label="Disponível" value={formatBRL(available)} />
        <Cell label="Reinvestimento" value={formatBRL(reinvestment)} />
      </div>

      {isLoss && (
        <p className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          <AlertTriangle className="size-4" />
          ⚠️ PREJUÍZO — o custo total ficou acima do preço de venda.
        </p>
      )}
    </article>
  );
}

function Cell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "primary" | "danger";
}) {
  const toneClass =
    tone === "primary" ? "text-primary" : tone === "danger" ? "text-destructive" : "";
  return (
    <div>
      <p className="label-caps">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  emphasis,
  danger,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="surface-card rounded-xl p-4">
      <p className="label-caps">{label}</p>
      <p
        className={`mt-1 text-xl font-bold ${danger ? "text-destructive" : emphasis ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card grid place-items-center rounded-xl px-6 py-12 text-center">
      <ShoppingBag className="size-8 text-muted-foreground" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
