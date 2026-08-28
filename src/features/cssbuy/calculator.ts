/**
 * CSSBuyCalculator
 * ----------------
 * Motor de cálculo da rota 🇨🇳 CSSBuy → Brasil.
 *
 * TOTALMENTE INDEPENDENTE da USCloser: moeda base CNY (¥), pesos em kg/g,
 * composição própria de custos (custos na China → remessa internacional →
 * tributos sobre o valor declarado) e conversão única pela cotação do yuan.
 *
 * Nenhuma alíquota é fixa no código: tudo chega por `CSSBuyConfig`.
 * O resultado é sempre uma ESTIMATIVA.
 */

export type WeightUnit = "kg" | "g";

export interface CSSBuyInput {
  /** Valor do produto (CNY). */
  productCny: number;
  /** Frete doméstico na China (CNY). */
  domesticShippingCny: number;
  /** Taxa de serviço CSSBuy (CNY). Se 0, é estimada por `servicePercent`. */
  serviceFeeCny: number;
  /** Outros custos na China (CNY): embalagem, remoção de etiqueta, fotos... */
  otherChinaCostsCny: number;
  /** Peso da remessa. */
  weight: number;
  /** Unidade do peso informado. */
  weightUnit: WeightUnit;
  /** Frete internacional (CNY). Se 0, é estimado por `freightPerKgCny`. */
  internationalShippingCny: number;
  /** Seguro (CNY). Se 0, é estimado por `insurancePercent` sobre o declarado. */
  insuranceCny: number;
  /** Valor declarado da remessa (CNY). Base dos tributos. */
  declaredValueCny: number;
  /** Outras taxas (CNY) — despacho, armazenagem, encargos do courier. */
  otherFeesCny: number;
  /** Quantidade de peças na remessa (para custo por peça). */
  pieces: number;
  /** Cotação do yuan: quantos reais vale 1 CNY. */
  cnyRate: number;
}

export interface CSSBuyConfig {
  /** Imposto de importação (%) sobre a base tributável. Editável. */
  importTaxPercent: number;
  /** ICMS (%) sobre base tributável + imposto de importação. Editável. */
  icmsPercent: number;
  /** Outras taxas (%) sobre a base tributável, somadas às taxas em ¥. Editável. */
  otherFeesPercent: number;
  /** Taxa de serviço CSSBuy (%) usada quando o campo em ¥ ficar zerado. */
  servicePercent: number;
  /** Seguro (%) sobre o valor declarado, usado quando o campo em ¥ ficar zerado. */
  insurancePercent: number;
  /** Frete internacional estimado por kg (CNY), usado quando o campo ficar zerado. */
  freightPerKgCny: number;
  /** O frete internacional entra na base tributável? Editável. */
  taxShipping: boolean;
  /** Peso máximo aceito por remessa (kg). */
  maxWeightKg: number;
}

export const DEFAULT_CSSBUY_CONFIG: CSSBuyConfig = {
  importTaxPercent: 60,
  icmsPercent: 17,
  otherFeesPercent: 0,
  servicePercent: 0,
  insurancePercent: 0,
  freightPerKgCny: 0,
  taxShipping: true,
  maxWeightKg: 30,
};

export interface CSSBuyStep {
  id: string;
  label: string;
  formula: string;
  value: string;
}

export interface CSSBuyResult {
  cnyRate: number;
  /** Peso normalizado em kg (a conversão de g é automática). */
  weightKg: number;
  pieces: number;

  /** Composição em yuan. */
  productCny: number;
  domesticShippingCny: number;
  serviceFeeCny: number;
  otherChinaCostsCny: number;
  chinaSubtotalCny: number;
  internationalShippingCny: number;
  insuranceCny: number;
  declaredValueCny: number;
  taxableBaseCny: number;
  importTaxCny: number;
  icmsCny: number;
  taxesCny: number;
  otherFeesCny: number;
  totalCny: number;
  costPerPieceCny: number;

  /** Composição em reais. */
  productBrl: number;
  domesticShippingBrl: number;
  serviceFeeBrl: number;
  otherChinaCostsBrl: number;
  internationalShippingBrl: number;
  insuranceBrl: number;
  taxesBrl: number;
  importTaxBrl: number;
  icmsBrl: number;
  otherFeesBrl: number;
  totalBrl: number;
  costPerPieceBrl: number;

  steps: CSSBuyStep[];
  warnings: string[];
  isComplete: boolean;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

const cny = (value: number) =>
  `¥ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

const brl = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const rate = (value: number) =>
  `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value)}`;

/** Converte qualquer unidade suportada para kg. */
export function toKilograms(weight: number, unit: WeightUnit): number {
  const value = positive(weight);
  return unit === "g" ? value / 1000 : value;
}

/**
 * Executa a estimativa CSSBuy.
 *
 * Encadeamento próprio:
 * 1. Custos na China = produto + frete doméstico + serviço CSSBuy + outros custos
 * 2. Remessa = frete internacional + seguro
 * 3. Base tributável = valor declarado (+ frete internacional, se configurado)
 * 4. Tributos = imposto de importação + ICMS + outras taxas (% da base)
 * 5. Custo final em ¥ → × cotação do yuan → custo final em R$ → ÷ peças
 */
export function calculateCSSBuy(
  input: CSSBuyInput,
  config: CSSBuyConfig = DEFAULT_CSSBUY_CONFIG,
): CSSBuyResult {
  const cnyRate = positive(input.cnyRate);
  const weightKg = round2(toKilograms(input.weight, input.weightUnit) * 1000) / 1000;
  const pieces = Math.max(1, Math.floor(positive(input.pieces)) || 1);

  // 1. Custos na China
  const productCny = round2(positive(input.productCny));
  const domesticShippingCny = round2(positive(input.domesticShippingCny));
  const informedService = positive(input.serviceFeeCny);
  const serviceFeeCny = round2(
    informedService > 0 ? informedService : productCny * (positive(config.servicePercent) / 100),
  );
  const otherChinaCostsCny = round2(positive(input.otherChinaCostsCny));
  const chinaSubtotalCny = round2(
    productCny + domesticShippingCny + serviceFeeCny + otherChinaCostsCny,
  );

  // 2. Remessa internacional
  const informedFreight = positive(input.internationalShippingCny);
  const internationalShippingCny = round2(
    informedFreight > 0 ? informedFreight : weightKg * positive(config.freightPerKgCny),
  );
  const declaredValueCny = round2(positive(input.declaredValueCny));
  const informedInsurance = positive(input.insuranceCny);
  const insuranceCny = round2(
    informedInsurance > 0
      ? informedInsurance
      : declaredValueCny * (positive(config.insurancePercent) / 100),
  );

  // 3. Base tributável (somente valores declarados)
  const taxableBaseCny = round2(
    declaredValueCny + (config.taxShipping ? internationalShippingCny : 0),
  );

  // 4. Tributos e taxas
  const importTaxCny = round2(taxableBaseCny * (positive(config.importTaxPercent) / 100));
  const icmsCny = round2((taxableBaseCny + importTaxCny) * (positive(config.icmsPercent) / 100));
  const taxesCny = round2(importTaxCny + icmsCny);
  const otherFeesCny = round2(
    positive(input.otherFeesCny) + taxableBaseCny * (positive(config.otherFeesPercent) / 100),
  );

  // 5. Custo final
  const totalCny = round2(
    chinaSubtotalCny + internationalShippingCny + insuranceCny + taxesCny + otherFeesCny,
  );
  const costPerPieceCny = round2(totalCny / pieces);

  const toBrl = (value: number) => round2(value * cnyRate);
  const productBrl = toBrl(productCny);
  const domesticShippingBrl = toBrl(domesticShippingCny);
  const serviceFeeBrl = toBrl(serviceFeeCny);
  const otherChinaCostsBrl = toBrl(otherChinaCostsCny);
  const internationalShippingBrl = toBrl(internationalShippingCny);
  const insuranceBrl = toBrl(insuranceCny);
  const importTaxBrl = toBrl(importTaxCny);
  const icmsBrl = toBrl(icmsCny);
  const taxesBrl = round2(importTaxBrl + icmsBrl);
  const otherFeesBrl = toBrl(otherFeesCny);
  const totalBrl = round2(
    productBrl +
      domesticShippingBrl +
      serviceFeeBrl +
      otherChinaCostsBrl +
      internationalShippingBrl +
      insuranceBrl +
      taxesBrl +
      otherFeesBrl,
  );
  const costPerPieceBrl = round2(totalBrl / pieces);

  const warnings: string[] = [];
  if (productCny <= 0) warnings.push("Informe o valor do produto em yuan (¥).");
  if (weightKg <= 0) warnings.push("Informe o peso da remessa.");
  if (weightKg > positive(config.maxWeightKg))
    warnings.push(`Peso acima do limite configurado de ${config.maxWeightKg} kg por remessa.`);
  if (cnyRate <= 0) warnings.push("Informe a cotação do yuan.");
  if (declaredValueCny <= 0)
    warnings.push("Sem valor declarado não há base tributável: os impostos ficam zerados.");
  if (declaredValueCny > 0 && declaredValueCny < productCny)
    warnings.push(
      "O valor declarado está abaixo do valor pago. Declare sempre o valor real da compra — esta calculadora é apenas uma estimativa de custos.",
    );

  const steps: CSSBuyStep[] = [
    {
      id: "china",
      label: "1. Custos na China",
      formula: `produto ${cny(productCny)} + frete doméstico ${cny(domesticShippingCny)} + serviço CSSBuy ${cny(serviceFeeCny)} + outros ${cny(otherChinaCostsCny)}`,
      value: cny(chinaSubtotalCny),
    },
    {
      id: "weight",
      label: "2. Peso normalizado",
      formula:
        input.weightUnit === "g"
          ? `${positive(input.weight)} g ÷ 1000 = ${weightKg} kg (conversão automática)`
          : `${weightKg} kg informados`,
      value: `${weightKg} kg`,
    },
    {
      id: "shipping",
      label: "3. Remessa internacional",
      formula:
        informedFreight > 0
          ? `frete informado ${cny(internationalShippingCny)} + seguro ${cny(insuranceCny)}`
          : `${weightKg} kg × ${cny(config.freightPerKgCny)}/kg = ${cny(internationalShippingCny)} + seguro ${cny(insuranceCny)}`,
      value: cny(round2(internationalShippingCny + insuranceCny)),
    },
    {
      id: "base",
      label: "4. Base tributável",
      formula: config.taxShipping
        ? `declarado ${cny(declaredValueCny)} + frete internacional ${cny(internationalShippingCny)}`
        : `declarado ${cny(declaredValueCny)} (frete fora da base, conforme configuração)`,
      value: cny(taxableBaseCny),
    },
    {
      id: "import-tax",
      label: `5. Imposto de importação (${config.importTaxPercent}%)`,
      formula: `${cny(taxableBaseCny)} × ${config.importTaxPercent}%`,
      value: cny(importTaxCny),
    },
    {
      id: "icms",
      label: `6. ICMS (${config.icmsPercent}%)`,
      formula: `(${cny(taxableBaseCny)} + ${cny(importTaxCny)}) × ${config.icmsPercent}%`,
      value: cny(icmsCny),
    },
    {
      id: "other-fees",
      label: "7. Outras taxas",
      formula: `taxas informadas + ${config.otherFeesPercent}% de ${cny(taxableBaseCny)}`,
      value: cny(otherFeesCny),
    },
    {
      id: "total-cny",
      label: "8. Custo final em yuan",
      formula: "China + remessa + seguro + impostos + outras taxas",
      value: cny(totalCny),
    },
    {
      id: "total-brl",
      label: "9. Conversão para reais",
      formula: `${cny(totalCny)} × cotação ${rate(cnyRate)}`,
      value: brl(totalBrl),
    },
    {
      id: "per-piece",
      label: "10. Custo por peça",
      formula: `${brl(totalBrl)} ÷ ${pieces} peça(s)`,
      value: brl(costPerPieceBrl),
    },
  ];

  return {
    cnyRate,
    weightKg,
    pieces,
    productCny,
    domesticShippingCny,
    serviceFeeCny,
    otherChinaCostsCny,
    chinaSubtotalCny,
    internationalShippingCny,
    insuranceCny,
    declaredValueCny,
    taxableBaseCny,
    importTaxCny,
    icmsCny,
    taxesCny,
    otherFeesCny,
    totalCny,
    costPerPieceCny,
    productBrl,
    domesticShippingBrl,
    serviceFeeBrl,
    otherChinaCostsBrl,
    internationalShippingBrl,
    insuranceBrl,
    taxesBrl,
    importTaxBrl,
    icmsBrl,
    otherFeesBrl,
    totalBrl,
    costPerPieceBrl,
    steps,
    warnings,
    isComplete: productCny > 0 && weightKg > 0 && cnyRate > 0,
  };
}

export const CSSBuyCalculator = {
  defaultConfig: DEFAULT_CSSBUY_CONFIG,
  calculate: calculateCSSBuy,
  toKilograms,
};
