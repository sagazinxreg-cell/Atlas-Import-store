/**
 * USCloserCalculator
 * ------------------
 * Módulo único de cálculo da rota 🇺🇸 USCloser → Brasil.
 *
 * Toda a matemática vive aqui. Os componentes de interface apenas informam
 * entradas e exibem o resultado. Assim as regras podem mudar sem tocar na UI.
 *
 * IMPORTANTE: as alíquotas NÃO são fixas no código. Elas chegam por
 * configuração (`USCloserConfig`) porque as regras tributárias podem mudar.
 * O resultado é sempre uma ESTIMATIVA.
 */

export interface USCloserInput {
  /** Valor efetivamente pago pelo produto (USD). */
  paidProductUsd: number;
  /** Valor declarado do produto (USD). Base dos impostos. */
  declaredProductUsd: number;
  /** Peso considerado no envio (lb). */
  weightLb: number;
  /** Frete declarado (USD). Opcional — zero significa não declarado. */
  declaredShippingUsd: number;
  /** Preço do mesmo item no Brasil (BRL). Opcional, só para comparação. */
  brazilPriceBrl: number | null;
  /** Dólar comercial (BRL por USD). */
  commercialRate: number;
}

export interface USCloserConfig {
  /** Alíquota do imposto de importação (%). Editável. */
  importTaxPercent: number;
  /** Alíquota do ICMS (%). Editável. */
  icmsPercent: number;
  /** Outras taxas (%) sobre a base tributável. Editável. */
  otherFeesPercent: number;
  /** Custo de frete real por libra (USD). Editável. */
  freightRatePerLbUsd: number;
  /** Serviço do intermediador (%) sobre o valor pago no produto. Editável. */
  servicePercent: number;
  /** Spread do dólar do intermediador sobre o comercial (ex.: 1.026). Editável. */
  operatorRateSpread: number;
  /** Peso máximo aceito por caixa (lb). */
  maxWeightLb: number;
}

export const DEFAULT_USCLOSER_CONFIG: USCloserConfig = {
  importTaxPercent: 60,
  icmsPercent: 18,
  otherFeesPercent: 0,
  freightRatePerLbUsd: 12,
  servicePercent: 5,
  operatorRateSpread: 1.026,
  maxWeightLb: 66,
};

export interface CalculationStep {
  id: string;
  label: string;
  formula: string;
  value: string;
}

export interface USCloserResult {
  /** Dólar usado em produto, frete real e serviço. */
  operatorRate: number;
  /** Dólar usado nos impostos. */
  commercialRate: number;

  productUsd: number;
  freightUsd: number;
  serviceUsd: number;
  taxableBaseUsd: number;
  importTaxUsd: number;
  icmsUsd: number;
  otherFeesUsd: number;
  totalUsd: number;

  productBrl: number;
  freightBrl: number;
  serviceBrl: number;
  importTaxBrl: number;
  icmsBrl: number;
  otherFeesBrl: number;
  taxesBrl: number;
  totalBrl: number;

  /** Comparação com o preço no Brasil (quando informado). */
  brazilPriceBrl: number | null;
  savingsBrl: number | null;
  savingsPercent: number | null;

  steps: CalculationStep[];
  warnings: string[];
  isComplete: boolean;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const safe = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const usd = (value: number) =>
  `US$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/**
 * Executa a estimativa completa.
 * Encadeamento: produto + frete + serviço → base tributável → impostos → taxas → custo final.
 */
export function calculateUSCloser(
  input: USCloserInput,
  config: USCloserConfig = DEFAULT_USCLOSER_CONFIG,
): USCloserResult {
  const paid = safe(input.paidProductUsd);
  const declared = safe(input.declaredProductUsd);
  const weight = safe(input.weightLb);
  const declaredShipping = safe(input.declaredShippingUsd);
  const commercialRate = safe(input.commercialRate);
  const operatorRate = round2Rate(commercialRate * config.operatorRateSpread);

  // 1. Custos operacionais em dólar
  const productUsd = round2(paid);
  const freightUsd = round2(weight * config.freightRatePerLbUsd);
  const serviceUsd = round2(paid * (config.servicePercent / 100));

  // 2. Base tributável (usa somente valores declarados)
  const taxableBaseUsd = round2(declared + declaredShipping);

  // 3. Impostos e taxas sobre a base declarada
  const importTaxUsd = round2(taxableBaseUsd * (config.importTaxPercent / 100));
  const icmsUsd = round2((taxableBaseUsd + importTaxUsd) * (config.icmsPercent / 100));
  const otherFeesUsd = round2(taxableBaseUsd * (config.otherFeesPercent / 100));
  const totalUsd = round2(productUsd + freightUsd + serviceUsd + importTaxUsd + icmsUsd + otherFeesUsd);

  // 4. Conversão: operação usa o dólar do intermediador, impostos o comercial
  const productBrl = round2(productUsd * operatorRate);
  const freightBrl = round2(freightUsd * operatorRate);
  const serviceBrl = round2(serviceUsd * operatorRate);
  const importTaxBrl = round2(importTaxUsd * commercialRate);
  const icmsBrl = round2(icmsUsd * commercialRate);
  const otherFeesBrl = round2(otherFeesUsd * commercialRate);
  const taxesBrl = round2(importTaxBrl + icmsBrl + otherFeesBrl);
  const totalBrl = round2(productBrl + freightBrl + serviceBrl + taxesBrl);

  // 5. Comparação opcional com o preço praticado no Brasil
  const brazilPrice = input.brazilPriceBrl != null && input.brazilPriceBrl > 0 ? input.brazilPriceBrl : null;
  const savingsBrl = brazilPrice != null ? round2(brazilPrice - totalBrl) : null;
  const savingsPercent =
    brazilPrice != null && brazilPrice > 0 ? round2(((brazilPrice - totalBrl) / brazilPrice) * 100) : null;

  const warnings: string[] = [];
  if (paid <= 0) warnings.push("Informe o valor pago pelo produto para concluir a simulação.");
  if (weight <= 0) warnings.push("Informe o peso considerado no envio.");
  if (weight > config.maxWeightLb) warnings.push(`Informe no máximo ${config.maxWeightLb} lb.`);
  if (commercialRate <= 0) warnings.push("Informe o dólar comercial.");
  if (declared > 0 && declared < paid)
    warnings.push(
      "O valor declarado está abaixo do valor pago. Declare sempre o valor real da compra — esta calculadora é apenas uma estimativa de custos.",
    );

  const steps: CalculationStep[] = [
    {
      id: "product",
      label: "Produto",
      formula: `valor pago ${usd(productUsd)} × dólar operação ${brl(operatorRate)}`,
      value: brl(productBrl),
    },
    {
      id: "freight",
      label: "Frete real",
      formula: `${weight} lb × ${usd(config.freightRatePerLbUsd)}/lb = ${usd(freightUsd)} × ${brl(operatorRate)}`,
      value: brl(freightBrl),
    },
    {
      id: "service",
      label: "Serviço do intermediador",
      formula: `${config.servicePercent}% de ${usd(productUsd)} = ${usd(serviceUsd)} × ${brl(operatorRate)}`,
      value: brl(serviceBrl),
    },
    {
      id: "base",
      label: "Base tributável",
      formula: `produto declarado ${usd(declared)} + frete declarado ${usd(declaredShipping)}`,
      value: usd(taxableBaseUsd),
    },
    {
      id: "import-tax",
      label: `Imposto de importação (${config.importTaxPercent}%)`,
      formula: `${usd(taxableBaseUsd)} × ${config.importTaxPercent}% = ${usd(importTaxUsd)} × dólar comercial ${brl(commercialRate)}`,
      value: brl(importTaxBrl),
    },
    {
      id: "icms",
      label: `ICMS (${config.icmsPercent}%)`,
      formula: `(${usd(taxableBaseUsd)} + ${usd(importTaxUsd)}) × ${config.icmsPercent}% = ${usd(icmsUsd)} × ${brl(commercialRate)}`,
      value: brl(icmsBrl),
    },
    {
      id: "other-fees",
      label: `Outras taxas (${config.otherFeesPercent}%)`,
      formula: `${usd(taxableBaseUsd)} × ${config.otherFeesPercent}% = ${usd(otherFeesUsd)} × ${brl(commercialRate)}`,
      value: brl(otherFeesBrl),
    },
    {
      id: "total",
      label: "Custo final estimado",
      formula: "produto + frete + serviço + impostos + taxas",
      value: brl(totalBrl),
    },
  ];

  return {
    operatorRate,
    commercialRate,
    productUsd,
    freightUsd,
    serviceUsd,
    taxableBaseUsd,
    importTaxUsd,
    icmsUsd,
    otherFeesUsd,
    totalUsd,
    productBrl,
    freightBrl,
    serviceBrl,
    importTaxBrl,
    icmsBrl,
    otherFeesBrl,
    taxesBrl,
    totalBrl,
    brazilPriceBrl: brazilPrice,
    savingsBrl,
    savingsPercent,
    steps,
    warnings,
    isComplete: paid > 0 && weight > 0 && commercialRate > 0,
  };
}

function round2Rate(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

export const USCloserCalculator = {
  defaultConfig: DEFAULT_USCLOSER_CONFIG,
  calculate: calculateUSCloser,
};
