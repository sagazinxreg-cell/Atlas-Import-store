import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Crown, RefreshCw, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import { USCloserCalculator, DEFAULT_USCLOSER_CONFIG } from "@/features/uscloser/calculator";
import { fetchCommercialUsdRate } from "@/features/uscloser/exchange-rate";
import {
  CSSBuyCalculator,
  DEFAULT_CSSBUY_CONFIG,
  type WeightUnit,
} from "@/features/cssbuy/calculator";
import { fetchCnyRate } from "@/features/cssbuy/exchange-rate";
import { ImportComparison, type ComparisonRow } from "./comparison";

function toNumber(value: string): number {
  const clean = value.replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Field({
  label,
  prefix,
  suffix,
  value,
  onChange,
  hint,
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      <div className="mt-1.5 flex items-stretch overflow-hidden rounded-lg border border-input bg-background/60">
        {prefix && (
          <span className="grid place-items-center border-r border-input px-2.5 text-xs font-semibold text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          value={value}
          inputMode="decimal"
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-none border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
        />
        {suffix && (
          <span className="grid place-items-center border-l border-input px-2.5 text-xs font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const METRICS: Array<{ key: keyof ComparisonRow; label: string; strong?: boolean }> = [
  { key: "productBrl", label: "Custo do produto" },
  { key: "shippingBrl", label: "Frete" },
  { key: "taxesBrl", label: "Impostos" },
  { key: "feesBrl", label: "Taxas" },
  { key: "totalBrl", label: "Custo final", strong: true },
  { key: "perPieceBrl", label: "Custo por peça" },
];

export function ComparePanel() {
  // --- USCloser (independente) ---
  const [usPaid, setUsPaid] = useState("0.00");
  const [usDeclared, setUsDeclared] = useState("0.00");
  const [usWeight, setUsWeight] = useState("1");
  const [usShipping, setUsShipping] = useState("0.00");
  const [usdRate, setUsdRate] = useState("5,40");
  const [usPieces, setUsPieces] = useState("1");
  const [loadingUsd, setLoadingUsd] = useState(false);

  // --- CSSBuy (independente) ---
  const [cnProduct, setCnProduct] = useState("0.00");
  const [cnDomestic, setCnDomestic] = useState("0.00");
  const [cnService, setCnService] = useState("0.00");
  const [cnOtherChina, setCnOtherChina] = useState("0.00");
  const [cnWeight, setCnWeight] = useState("1");
  const [cnWeightUnit, setCnWeightUnit] = useState<WeightUnit>("kg");
  const [cnInternational, setCnInternational] = useState("0.00");
  const [cnInsurance, setCnInsurance] = useState("0.00");
  const [cnDeclared, setCnDeclared] = useState("0.00");
  const [cnOtherFees, setCnOtherFees] = useState("0.00");
  const [cnPieces, setCnPieces] = useState("1");
  const [cnyRate, setCnyRate] = useState("0,78");
  const [loadingCny, setLoadingCny] = useState(false);

  const [rateError, setRateError] = useState<string | null>(null);

  const outcome = useMemo(() => {
    const usResult = USCloserCalculator.calculate(
      {
        paidProductUsd: toNumber(usPaid),
        declaredProductUsd: toNumber(usDeclared) || toNumber(usPaid),
        weightLb: toNumber(usWeight),
        declaredShippingUsd: toNumber(usShipping),
        brazilPriceBrl: null,
        commercialRate: toNumber(usdRate),
      },
      DEFAULT_USCLOSER_CONFIG,
    );

    const cnResult = CSSBuyCalculator.calculate(
      {
        productCny: toNumber(cnProduct),
        domesticShippingCny: toNumber(cnDomestic),
        serviceFeeCny: toNumber(cnService),
        otherChinaCostsCny: toNumber(cnOtherChina),
        weight: toNumber(cnWeight),
        weightUnit: cnWeightUnit,
        internationalShippingCny: toNumber(cnInternational),
        insuranceCny: toNumber(cnInsurance),
        declaredValueCny: toNumber(cnDeclared),
        otherFeesCny: toNumber(cnOtherFees),
        pieces: toNumber(cnPieces),
        cnyRate: toNumber(cnyRate),
      },
      DEFAULT_CSSBUY_CONFIG,
    );

    return ImportComparison.compare([
      ImportComparison.toUSCloserRow(usResult, toNumber(usPieces)),
      ImportComparison.toCSSBuyRow(cnResult),
    ]);
  }, [
    usPaid,
    usDeclared,
    usWeight,
    usShipping,
    usdRate,
    usPieces,
    cnProduct,
    cnDomestic,
    cnService,
    cnOtherChina,
    cnWeight,
    cnWeightUnit,
    cnInternational,
    cnInsurance,
    cnDeclared,
    cnOtherFees,
    cnPieces,
    cnyRate,
  ]);

  const { rows, verdict } = outcome;

  async function updateUsd() {
    setLoadingUsd(true);
    setRateError(null);
    try {
      const rate = await fetchCommercialUsdRate();
      setUsdRate(rate.toFixed(4).replace(".", ","));
    } catch {
      setRateError("Não foi possível atualizar o dólar agora. Informe manualmente.");
    } finally {
      setLoadingUsd(false);
    }
  }

  async function updateCny() {
    setLoadingCny(true);
    setRateError(null);
    try {
      const quote = await fetchCnyRate();
      setCnyRate(quote.rate.toFixed(4).replace(".", ","));
    } catch {
      setRateError("Não foi possível atualizar o yuan agora. Informe manualmente.");
    } finally {
      setLoadingCny(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* ENTRADAS LADO A LADO */}
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="surface-card rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇺🇸</span>
            <h2 className="text-base font-bold">USCloser (USD)</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Valor pago pelo produto" prefix="US$" value={usPaid} onChange={setUsPaid} />
            <Field
              label="Valor declarado"
              prefix="US$"
              value={usDeclared}
              onChange={setUsDeclared}
              hint="Zerado usa o valor pago."
            />
            <Field label="Peso do envio" suffix="lb" value={usWeight} onChange={setUsWeight} />
            <Field
              label="Frete declarado"
              prefix="US$"
              value={usShipping}
              onChange={setUsShipping}
            />
            <Field label="Quantidade de peças" suffix="peças" value={usPieces} onChange={setUsPieces} />
            <div>
              <Field label="Dólar comercial" prefix="R$" value={usdRate} onChange={setUsdRate} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={updateUsd}
                disabled={loadingUsd}
              >
                <RefreshCw className={loadingUsd ? "animate-spin" : ""} />
                Atualizar dólar
              </Button>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇨🇳</span>
            <h2 className="text-base font-bold">CSSBuy (CNY)</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Valor do produto" prefix="¥" value={cnProduct} onChange={setCnProduct} />
            <Field label="Frete na China" prefix="¥" value={cnDomestic} onChange={setCnDomestic} />
            <Field label="Taxa de serviço" prefix="¥" value={cnService} onChange={setCnService} />
            <Field
              label="Outros custos na China"
              prefix="¥"
              value={cnOtherChina}
              onChange={setCnOtherChina}
            />
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Peso da remessa</Label>
              <div className="mt-1.5 flex items-stretch gap-2">
                <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg border border-input bg-background/60">
                  <Input
                    value={cnWeight}
                    inputMode="decimal"
                    onChange={(event) => setCnWeight(event.target.value)}
                    className="h-10 rounded-none border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
                  />
                </div>
                <div className="flex overflow-hidden rounded-lg border border-input">
                  {(["kg", "g"] as WeightUnit[]).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setCnWeightUnit(unit)}
                      className={`cursor-pointer px-3 text-xs font-bold transition-colors ${
                        cnWeightUnit === unit
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/60 text-muted-foreground hover:bg-surface"
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Field
              label="Frete internacional"
              prefix="¥"
              value={cnInternational}
              onChange={setCnInternational}
            />
            <Field label="Seguro" prefix="¥" value={cnInsurance} onChange={setCnInsurance} />
            <Field
              label="Valor declarado"
              prefix="¥"
              value={cnDeclared}
              onChange={setCnDeclared}
              hint="Base dos impostos."
            />
            <Field label="Outras taxas" prefix="¥" value={cnOtherFees} onChange={setCnOtherFees} />
            <Field label="Quantidade de peças" suffix="peças" value={cnPieces} onChange={setCnPieces} />
            <div>
              <Field label="Cotação do yuan" prefix="R$" value={cnyRate} onChange={setCnyRate} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={updateCny}
                disabled={loadingCny}
              >
                <RefreshCw className={loadingCny ? "animate-spin" : ""} />
                Atualizar yuan
              </Button>
            </div>
          </div>
        </section>
      </div>

      {rateError && (
        <p className="flex items-center gap-2 rounded-xl border border-border bg-surface/50 px-4 py-3 text-xs text-muted-foreground">
          <AlertTriangle className="size-4 shrink-0" />
          {rateError}
        </p>
      )}

      {/* TABELA COMPARATIVA */}
      <section className="surface-card overflow-hidden rounded-2xl">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Scale className="size-4 text-primary" />
          <h2 className="text-base font-bold">Comparativo em reais</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Método
                </th>
                {rows.map((row) => (
                  <th
                    key={row.id}
                    className={`px-5 py-3 text-right text-sm font-bold ${
                      verdict?.bestId === row.id && !verdict.isTie ? "text-primary" : ""
                    }`}
                  >
                    <span className="mr-1">{row.flag}</span>
                    {row.method}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => (
                <tr key={metric.key as string} className="border-b border-border/60 last:border-0">
                  <td
                    className={`px-5 py-3 text-left ${
                      metric.strong ? "font-bold" : "text-muted-foreground"
                    }`}
                  >
                    {metric.label}
                  </td>
                  {rows.map((row) => {
                    const isBest = verdict?.bestId === row.id && !verdict.isTie;
                    return (
                      <td
                        key={row.id}
                        className={`px-5 py-3 text-right tabular-nums ${
                          metric.strong
                            ? isBest
                              ? "text-base font-bold text-primary"
                              : "text-base font-bold"
                            : "font-semibold"
                        }`}
                      >
                        {formatBRL(row[metric.key] as number)}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="px-5 py-3 text-left text-muted-foreground">Peças na remessa</td>
                {rows.map((row) => (
                  <td key={row.id} className="px-5 py-3 text-right font-semibold tabular-nums">
                    {row.pieces}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* MELHOR OPÇÃO */}
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <p className="label-caps">Melhor opção</p>

        {verdict ? (
          verdict.isTie ? (
            <>
              <h2 className="mt-2 text-2xl font-bold">Empate técnico</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                As duas rotas chegam praticamente ao mesmo custo final. Decida por prazo, risco e
                confiabilidade do fornecedor.
              </p>
            </>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Crown className="size-6 text-primary" />
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {verdict.bestLabel} é {formatBRL(verdict.differenceBrl)} mais barato
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Economia de{" "}
                <strong className="text-foreground">
                  {verdict.differencePercent.toLocaleString("pt-BR", {
                    maximumFractionDigits: 2,
                  })}
                  %
                </strong>{" "}
                em relação a {verdict.loserLabel}, e {formatBRL(verdict.differencePerPieceBrl)} de
                diferença por peça.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-xl border p-4 ${
                      verdict.bestId === row.id
                        ? "border-primary bg-primary/10"
                        : "border-border bg-surface/40"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {row.flag} {row.method}
                    </p>
                    <p className="mt-1 text-xl font-bold">{formatBRL(row.totalBrl)}</p>
                  </div>
                ))}
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Diferença
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-xl font-bold">
                    {formatBRL(verdict.differenceBrl)}
                    <ArrowRight className="size-4 text-primary" />
                    <span className="text-base">
                      {verdict.differencePercent.toLocaleString("pt-BR", {
                        maximumFractionDigits: 2,
                      })}
                      %
                    </span>
                  </p>
                </div>
              </div>
            </>
          )
        ) : (
          <>
            <h2 className="mt-2 text-xl font-bold">Preencha as duas simulações</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              O veredito aparece quando as duas rotas tiverem produto, peso e cotação informados.
            </p>
            <ul className="mt-4 grid gap-2">
              {rows.flatMap((row) =>
                row.warnings.map((warning) => (
                  <li
                    key={`${row.id}-${warning}`}
                    className="flex items-start gap-2 rounded-xl border border-border bg-surface/40 px-4 py-3 text-xs text-muted-foreground"
                  >
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      <strong className="text-foreground">
                        {row.flag} {row.method}:
                      </strong>{" "}
                      {warning}
                    </span>
                  </li>
                )),
              )}
            </ul>
          </>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          Os cálculos de cada rota são independentes e usam as mesmas fórmulas das calculadoras
          USCloser e CSSBuy. Todos os valores são estimativas.
        </p>
      </section>
    </div>
  );
}
