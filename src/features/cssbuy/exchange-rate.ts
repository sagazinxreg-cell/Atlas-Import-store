/**
 * Fonte de cotação do yuan (CNY → BRL).
 *
 * Arquitetura pronta para API: a UI depende apenas do contrato
 * `CnyRateProvider`. Hoje usamos uma cotação pública; amanhã basta trocar o
 * provider (API própria, cache no banco, cotação do intermediador) sem
 * mexer no motor de cálculo nem na interface. O campo permanece editável
 * manualmente em qualquer cenário.
 */

export interface CnyRateQuote {
  /** Quantos reais vale 1 CNY. */
  rate: number;
  /** Momento da coleta. */
  fetchedAt: Date;
  /** Origem da cotação, exibida na interface. */
  source: string;
}

export interface CnyRateProvider {
  id: string;
  label: string;
  fetchRate(): Promise<CnyRateQuote>;
}

/** Provider padrão: cotação pública CNY-BRL. */
export const publicCnyRateProvider: CnyRateProvider = {
  id: "awesomeapi-cny-brl",
  label: "Cotação pública CNY/BRL",
  async fetchRate() {
    const response = await fetch("https://economia.awesomeapi.com.br/last/CNY-BRL", {
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error("Cotação indisponível");
    const payload = (await response.json()) as { CNYBRL?: { bid?: string } };
    const rate = Number(payload?.CNYBRL?.bid);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Cotação inválida");
    return { rate, fetchedAt: new Date(), source: "CNY/BRL — cotação pública" };
  },
};

/** Provider ativo. Troque aqui quando a API definitiva existir. */
export const cnyRateProvider: CnyRateProvider = publicCnyRateProvider;

export function fetchCnyRate(): Promise<CnyRateQuote> {
  return cnyRateProvider.fetchRate();
}
