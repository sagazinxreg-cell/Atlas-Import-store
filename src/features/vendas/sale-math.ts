/**
 * Motor de cálculo das vendas (Atlas Store).
 *
 * Espelha exatamente a lógica aplicada no banco (trigger compute_sale_financials):
 *   receita  = preço de venda × quantidade
 *   custo    = custo real por peça × quantidade + taxa de pagamento + outros custos
 *   lucro    = receita - custo
 *   disponível     = lucro × percentual disponível
 *   reinvestimento = lucro - disponível
 *
 * Regras:
 * - a taxa de pagamento é sempre descontada ANTES do lucro final;
 * - se o custo total for maior que a receita, o resultado é PREJUÍZO (nunca lucro);
 * - faturamento (receita) nunca é tratado como lucro.
 */

export type SaleMathInput = {
  /** Preço de venda unitário, em BRL. */
  salePrice: number;
  /** Quantidade vendida. */
  quantity: number;
  /** Custo real por peça (custo total do produto), em BRL. */
  unitCost: number;
  /** Taxa de pagamento (maquininha, gateway, parcelamento), em BRL. */
  paymentFee: number;
  /** Outros custos da venda (frete ao cliente, embalagem...), em BRL. */
  otherCosts: number;
  /** Percentual do lucro que fica disponível para retirada. */
  availablePercentage: number;
};

export type SaleMathResult = {
  quantity: number;
  /** Faturamento bruto da venda. */
  revenue: number;
  /** Custo dos produtos vendidos (sem taxas). */
  productCost: number;
  paymentFee: number;
  otherCosts: number;
  /** Custo total = produtos + taxa de pagamento + outros custos. */
  totalCost: number;
  /** Resultado da venda (positivo = lucro, negativo = prejuízo). */
  profit: number;
  /** true quando o custo total supera a receita. */
  isLoss: boolean;
  availablePercentage: number;
  reinvestmentPercentage: number;
  /** Parte do lucro disponível para retirada (0 em caso de prejuízo). */
  availableProfit: number;
  /** Parte do lucro reservada para reinvestimento (0 em caso de prejuízo). */
  reinvestmentProfit: number;
  /** Margem sobre a receita, em %. */
  marginPercentage: number;
};

export const DEFAULT_AVAILABLE_PERCENTAGE = 50;

const round2 = (value: number) => Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

export function calculateSale(input: SaleMathInput): SaleMathResult {
  const quantity = Math.max(1, Math.floor(positive(input.quantity) || 1));
  const salePrice = positive(input.salePrice);
  const unitCost = positive(input.unitCost);
  const paymentFee = positive(input.paymentFee);
  const otherCosts = positive(input.otherCosts);

  const availablePercentage = Math.min(
    100,
    Math.max(0, Number.isFinite(input.availablePercentage) ? input.availablePercentage : DEFAULT_AVAILABLE_PERCENTAGE),
  );
  const reinvestmentPercentage = round2(100 - availablePercentage);

  const revenue = round2(salePrice * quantity);
  const productCost = round2(unitCost * quantity);
  const totalCost = round2(productCost + paymentFee + otherCosts);
  const profit = round2(revenue - totalCost);
  const isLoss = profit < 0;

  const availableProfit = isLoss ? 0 : round2((profit * availablePercentage) / 100);
  const reinvestmentProfit = isLoss ? 0 : round2(profit - availableProfit);

  return {
    quantity,
    revenue,
    productCost,
    paymentFee,
    otherCosts,
    totalCost,
    profit,
    isLoss,
    availablePercentage,
    reinvestmentPercentage,
    availableProfit,
    reinvestmentProfit,
    marginPercentage: revenue > 0 ? round2((profit / revenue) * 100) : 0,
  };
}

export const SALE_CHANNELS = [
  "instagram",
  "whatsapp",
  "marketplace",
  "in_person",
  "other",
] as const;

export const SALE_CHANNEL_LABELS: Record<(typeof SALE_CHANNELS)[number], string> = {
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  marketplace: "Marketplace",
  in_person: "Presencial",
  other: "Outro",
};
