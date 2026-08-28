import { useMemo, useState } from "react";
import { ImageIcon, Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { formatBRL, formatNumber, formatPercent } from "@/lib/format";
import { IMPORT_METHOD_LABELS, PRODUCT_CATEGORIES, calculateMargin } from "./cost";
import { ProductFormDialog } from "./product-form-dialog";
import {
  useDeleteProduct,
  useProducts,
  useSuppliers,
  type ProductWithSupplier,
} from "./use-products";

const ALL = "__all__";

export function ProductsPanel() {
  const products = useProducts();
  const suppliers = useSuppliers();
  const remove = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithSupplier | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);

  const rows = useMemo(() => {
    const list = products.data ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((product) => {
      const matchesCategory = category === ALL || product.category === category;
      const matchesTerm =
        !term ||
        [product.name, product.brand, product.color, product.size, product.supplier?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      return matchesCategory && matchesTerm;
    });
  }, [products.data, search, category]);

  const totals = useMemo(() => {
    const list = products.data ?? [];
    return list.reduce(
      (acc, product) => {
        const quantity = Number(product.quantity ?? 0);
        acc.pieces += quantity;
        acc.cost += quantity * Number(product.total_cost ?? 0);
        acc.revenue += quantity * Number(product.sale_price ?? 0);
        return acc;
      },
      { pieces: 0, cost: 0, revenue: 0 },
    );
  }, [products.data]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(product: ProductWithSupplier) {
    setEditing(product);
    setDialogOpen(true);
  }

  async function handleDelete(product: ProductWithSupplier) {
    try {
      await remove.mutateAsync(product.id);
      toast.success("Produto removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Operação"
        title="Produtos"
        description="Catálogo com custo real por peça, preço de venda e margem."
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" />
            Novo produto
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Peças em estoque" value={formatNumber(totals.pieces)} />
        <SummaryCard label="Custo real do estoque" value={formatBRL(totals.cost)} />
        <SummaryCard label="Receita potencial" value={formatBRL(totals.revenue)} emphasis />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 pl-9"
            placeholder="Buscar por nome, marca, cor..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-10 sm:w-52">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as categorias</SelectItem>
            {PRODUCT_CATEGORIES.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 space-y-3">
        {products.isLoading && (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        )}

        {products.isError && (
          <EmptyState
            title="Não foi possível carregar os produtos"
            description={
              products.error instanceof Error
                ? products.error.message
                : "Tente novamente em instantes."
            }
          />
        )}

        {products.isSuccess && rows.length === 0 && (
          <EmptyState
            title="Nenhum produto cadastrado ainda"
            description="Cadastre seu primeiro produto para acompanhar custo real, margem e estoque."
            action={
              <Button onClick={openNew}>
                <Plus className="size-4" />
                Novo produto
              </Button>
            }
          />
        )}

        {rows.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            onEdit={() => openEdit(product)}
            onDelete={() => handleDelete(product)}
          />
        ))}
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        suppliers={(suppliers.data ?? []).map((supplier) => supplier.name)}
      />
    </>
  );
}

function SummaryCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="surface-card rounded-xl p-4">
      <p className="label-caps">{label}</p>
      <p className={`mt-1 text-xl font-bold ${emphasis ? "text-primary" : ""}`}>{value}</p>
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
      <Package className="size-8 text-muted-foreground" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function ProductRow({
  product,
  onEdit,
  onDelete,
}: {
  product: ProductWithSupplier;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const costPerUnit = Number(product.total_cost ?? 0);
  const margin = calculateMargin(costPerUnit, Number(product.sale_price ?? 0));
  const details = [
    product.brand,
    product.category,
    product.size,
    product.color,
    product.supplier?.name,
    product.country,
    product.import_method ? IMPORT_METHOD_LABELS[product.import_method] : null,
  ].filter(Boolean);

  return (
    <article className="surface-card rounded-xl p-4">
      <div className="flex gap-4">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-background/60">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">{product.name}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {details.join(" · ") || "Sem detalhes"}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button size="icon" variant="ghost" onClick={onEdit} aria-label="Editar produto">
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Excluir produto">
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <Stat label="Custo por peça" value={formatBRL(costPerUnit)} />
            <Stat label="Preço de venda" value={formatBRL(Number(product.sale_price ?? 0))} />
            <Stat
              label="Lucro / margem"
              value={`${formatBRL(margin.profit)} · ${formatPercent(margin.marginPercent, 1)}`}
              highlight
            />
            <Stat label="Estoque" value={`${formatNumber(Number(product.quantity ?? 0))} pç`} />
          </dl>

          {product.notes && (
            <p className="mt-3 text-xs text-muted-foreground">{product.notes}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className={`mt-0.5 text-sm font-semibold ${highlight ? "text-primary" : ""}`}>{value}</dd>
    </div>
  );
}
