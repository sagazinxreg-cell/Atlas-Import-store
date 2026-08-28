/**
 * ImportComparison
 * ----------------
 * Módulo de COMPARAÇÃO entre as duas rotas de importação.
 *
 * Regra de arquitetura: este módulo NÃO recalcula nada e NÃO altera as
 * calculadoras existentes. Ele apenas consome os resultados já produzidos por
 * `calculateUSCloser` e `calculateCSSBuy` (cálculos totalmente independentes)
 * e normaliza os números para uma tabela lado a lado em reais.
 *
 * O resultado é sempre uma ESTIMATIVA.
 */

import type { USCloserResult } from "@/features/uscloser/calculator";
import type { CSSBuyResult } from "@/features/cssbuy/calculator";

export type ComparisonMethodId = "uscloser" | "cssbuy";

export interface ComparisonRow {
  id: ComparisonMethodId;
  /** Método */
  method: string;
  flag: string;
  /** Custo do produto (R$) */
  productBrl: number;
  /** Frete (R$) — soma de todos os fretes da rota */
  shippingBrl: number;
  /** Impostos (R$) — imposto de importação + ICMS */
  taxesBrl: number;
  /** Taxas (R$) — serviço, seguro, outras taxas */
  feesBrl: number;
  /** Custo final (R$) */
  totalBrl: number;
  /** Custo por peça (R$) */
  perPieceBrl: number;
  pieces: number;
  isComplete: boolean;
  warnings: string[];
}

export interface ComparisonVerdict {
  /** Método mais barato no custo final. */
  bestId: ComparisonMethodId;
  bestLabel: string;
  loserId: ComparisonMethodId;
  loserLabel: string;
  /** Diferença absoluta em reais no custo final. */
  differenceBrl: number;
  /** Diferença percentual em relação à opção mais cara. */
  differencePercent: number;
  /** Diferença absoluta no custo por peça. */
  differencePerPieceBrl: number;
  /** Empate técnico (diferença menor que 1 centavo). */
  isTie: boolean;
}

export interface ComparisonOutcome {
  rows: ComparisonRow[];
  verdict: ComparisonVerdict | null;
  /** Só há veredito quando as duas simulações estão completas. */
  isComparable: boolean;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0);

/** Normaliza o resultado USCloser (USD → BRL já feito na calculadora). */
export function toUSCloserRow(result: USCloserResult, pieces: number): ComparisonRow {
  const safePieces = Math.max(1, Math.floor(positive(pieces)) || 1);
  const total = round2(result.totalBrl);

  return {
    id: "uscloser",
    method: "USCloser",
    flag: "🇺🇸",
    productBrl: round2(result.productBrl),
    shippingBrl: round2(result.freightBrl),
    taxesBrl: round2(result.importTaxBrl + result.icmsBrl),
    feesBrl: round2(result.serviceBrl + result.otherFeesBrl),
    totalBrl: total,
    perPieceBrl: round2(total / safePieces),
    pieces: safePieces,
    isComplete: result.isComplete,
    warnings: result.warnings,
  };
}

/** Normaliza o resultado CSSBuy (CNY → BRL já feito na calculadora). */
export function toCSSBuyRow(result: CSSBuyResult): ComparisonRow {
  return {
    id: "cssbuy",
    method: "CSSBuy",
    flag: "🇨🇳",
    productBrl: round2(result.productBrl),
    shippingBrl: round2(result.domesticShippingBrl + result.internationalShippingBrl),
    taxesBrl: round2(result.importTaxBrl + result.icmsBrl),
    feesBrl: round2(
      result.serviceFeeBrl + result.otherChinaCostsBrl + result.insuranceBrl + result.otherFeesBrl,
    ),
    totalBrl: round2(result.totalBrl),
    perPieceBrl: round2(result.costPerPieceBrl),
    pieces: result.pieces,
    isComplete: result.isComplete,
    warnings: result.warnings,
  };
}

/**
 * Compara as duas linhas e aponta a MELHOR OPÇÃO (menor custo final).
 * A diferença percentual usa a opção mais cara como referência:
 * (maior - menor) / maior × 100.
 */
export function compareImports(rows: [ComparisonRow, ComparisonRow]): ComparisonOutcome {
  const isComparable = rows.every((row) => row.isComplete && row.totalBrl > 0);

  if (!isComparable) {
    return { rows, verdict: null, isComparable: false };
  }

  const sorted: [ComparisonRow, ComparisonRow] =
    rows[0].totalBrl <= rows[1].totalBrl ? [rows[0], rows[1]] : [rows[1], rows[0]];
  const cheapest = sorted[0];
  const priciest = sorted[1];
  const differenceBrl = round2(priciest.totalBrl - cheapest.totalBrl);

  return {
    rows,
    isComparable: true,
    verdict: {
      bestId: cheapest.id,
      bestLabel: cheapest.method,
      loserId: priciest.id,
      loserLabel: priciest.method,
      differenceBrl,
      differencePercent:
        priciest.totalBrl > 0 ? round2((differenceBrl / priciest.totalBrl) * 100) : 0,
      differencePerPieceBrl: round2(priciest.perPieceBrl - cheapest.perPieceBrl),
      isTie: differenceBrl < 0.01,
    },
  };
}

export const ImportComparison = {
  toUSCloserRow,
  toCSSBuyRow,
  compare: compareImports,
};
