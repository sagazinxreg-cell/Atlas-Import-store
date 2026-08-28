/**
 * Motor de custo real dos produtos (Atlas Store).
 *
 * Regra: o custo de um produto NUNCA é apenas o preço de compra.
 * Custo total do lote = produtos + frete + impostos + taxas + outros custos.
 * Custos compartilhados são rateados igualmente entre as peças do lote,
 * gerando o custo médio por peça.
 */

export type ProductCostInput = {
  /** Valor pago somente nos produtos (lote inteiro), em BRL. */
  productTotal: number;
  /** Frete (internacional + doméstico), em BRL. */
  shipping: number;
  /** Impostos de importação (II, ICMS, etc.), em BRL. */
  taxes: number;
  /** Taxas de serviço/agenciamento/pagamento, em BRL. */
  fees: number;
  /** Outros custos do lote (seguro, embalagem, etc.), em BRL. */
  otherCosts: number;
  /** Quantidade de peças no lote. */
  quantity: number;
};

export type ProductCostResult = {
  quantity: number;
  /** Soma dos custos compartilhados (frete + impostos + taxas + outros). */
  sharedCosts: number;
  /** Custo total do lote (produtos + compartilhados). */
  totalCost: number;
  /** Preço de compra médio por peça. */
  purchasePricePerUnit: number;
  /** Custos compartilhados rateados por peça. */
  importCostPerUnit: number;
  /** Custo real médio por peça. */
  totalCostPerUnit: number;
  breakdown: { label: string; value: number; perUnit: number }[];
};

const round2 = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const safe = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

export function calculateProductCost(input: ProductCostInput): ProductCostResult {
  const quantity = Math.max(1, Math.floor(safe(input.quantity)));
  const productTotal = safe(input.productTotal);
  const shipping = safe(input.shipping);
  const taxes = safe(input.taxes);
  const fees = safe(input.fees);
  const otherCosts = safe(input.otherCosts);

  const sharedCosts = shipping + taxes + fees + otherCosts;
  const totalCost = productTotal + sharedCosts;

  const purchasePricePerUnit = round2(productTotal / quantity);
  const importCostPerUnit = round2(sharedCosts / quantity);

  const perUnit = (value: number) => round2(value / quantity);

  return {
    quantity,
    sharedCosts: round2(sharedCosts),
    totalCost: round2(totalCost),
    purchasePricePerUnit,
    importCostPerUnit,
    totalCostPerUnit: round2(purchasePricePerUnit + importCostPerUnit),
    breakdown: [
      { label: "Produtos", value: round2(productTotal), perUnit: perUnit(productTotal) },
      { label: "Frete", value: round2(shipping), perUnit: perUnit(shipping) },
      { label: "Impostos", value: round2(taxes), perUnit: perUnit(taxes) },
      { label: "Taxas", value: round2(fees), perUnit: perUnit(fees) },
      { label: "Outros custos", value: round2(otherCosts), perUnit: perUnit(otherCosts) },
    ],
  };
}

/** Margem e lucro por peça, a partir do custo real. */
export function calculateMargin(costPerUnit: number, salePrice: number) {
  const profit = round2(safe(salePrice) - safe(costPerUnit));
  const marginPercent = safe(salePrice) > 0 ? round2((profit / salePrice) * 100) : 0;
  const markupPercent = safe(costPerUnit) > 0 ? round2((profit / costPerUnit) * 100) : 0;
  return { profit, marginPercent, markupPercent };
}

export const PRODUCT_CATEGORIES = [
  "Camiseta",
  "Blusa",
  "Moletom",
  "Bermuda",
  "Calça",
  "Tênis",
  "Boné",
  "Jaqueta",
  "Outros",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const IMPORT_METHOD_LABELS: Record<string, string> = {
  uscloser: "USCloser",
  cssbuy: "CSSBuy",
  direct: "Compra direta",
  other: "Outro",
};

export const IMPORT_METHODS = ["uscloser", "cssbuy", "direct", "other"] as const;
