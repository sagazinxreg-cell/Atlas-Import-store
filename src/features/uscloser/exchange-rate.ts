/** Busca a cotação do dólar comercial. Falha silenciosa: o campo é editável. */
export async function fetchCommercialUsdRate(): Promise<number> {
  const response = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL", {
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error("Cotação indisponível");
  const payload = (await response.json()) as { USDBRL?: { bid?: string } };
  const rate = Number(payload?.USDBRL?.bid);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("Cotação inválida");
  return rate;
}
