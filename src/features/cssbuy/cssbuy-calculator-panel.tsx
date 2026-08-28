import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, Info, RefreshCw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import {
  CSSBuyCalculator,
  DEFAULT_CSSBUY_CONFIG,
  type CSSBuyConfig,
  type WeightUnit,
} from "./calculator";
import { fetchCnyRate } from "./exchange-rate";

const cnyFormat = (value: number) =>
  `¥ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

const rateFormat = (value: number) =>
  `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value)}`;

function toNumber(value: string): number {
  const clean = value.replace(/\s/g, "");
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function Field({
  label,
  hint,
  badge,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
  children,
}: {
  label: string;
  hint?: string;
  badge?: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Label className="text-sm font-semibold">{label}</Label>
        {badge && (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-stretch overflow-hidden rounded-lg border border-input bg-background/60">
        {prefix && (
          <span className="grid place-items-center border-r border-input px-3 text-sm font-semibold text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          value={value}
          inputMode="decimal"
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-none border-0 bg-transparent text-base font-semibold shadow-none focus-visible:ring-0"
        />
        {suffix && (
          <span className="grid place-items-center border-l border-input px-3 text-sm font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
        {children}
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-xl border border-border bg-surface/40 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={strong ? "text-lg font-bold text-primary" : "text-base font-semibold"}>
        {value}
      </span>
    </div>
  );
}

export function CSSBuyCalculatorPanel() {
  const [product, setProduct] = useState("0.00");
  const [domesticShipping, setDomesticShipping] = useState("0.00");
  const [serviceFee, setServiceFee] = useState("0.00");
  const [otherChinaCosts, setOtherChinaCosts] = useState("0.00");
  const [weight, setWeight] = useState("1");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("kg");
  const [internationalShipping, setInternationalShipping] = useState("0.00");
  const [insurance, setInsurance] = useState("0.00");
  const [declaredValue, setDeclaredValue] = useState("0.00");
  const [otherFees, setOtherFees] = useState("0.00");
  const [pieces, setPieces] = useState("1");
  const [rate, setRate] = useState("0,78");
  const [rateStatus, setRateStatus] = useState<null | { kind: "ok" | "error"; message: string }>(
    null,
  );
  const [loadingRate, setLoadingRate] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<CSSBuyConfig>(DEFAULT_CSSBUY_CONFIG);

  const result = useMemo(
    () =>
      CSSBuyCalculator.calculate(
        {
          productCny: toNumber(product),
          domesticShippingCny: toNumber(domesticShipping),
          serviceFeeCny: toNumber(serviceFee),
          otherChinaCostsCny: toNumber(otherChinaCosts),
          weight: toNumber(weight),
          weightUnit,
          internationalShippingCny: toNumber(internationalShipping),
          insuranceCny: toNumber(insurance),
          declaredValueCny: toNumber(declaredValue),
          otherFeesCny: toNumber(otherFees),
          pieces: toNumber(pieces),
          cnyRate: toNumber(rate),
        },
        config,
      ),
    [
      product,
      domesticShipping,
      serviceFee,
      otherChinaCosts,
      weight,
      weightUnit,
      internationalShipping,
      insurance,
      declaredValue,
      otherFees,
      pieces,
      rate,
      config,
    ],
  );

  async function updateRate() {
    setLoadingRate(true);
    try {
      const quote = await fetchCnyRate();
      setRate(quote.rate.toFixed(4).replace(".", ","));
      setRateStatus({ kind: "ok", message: `Atualizada agora — ${quote.source}.` });
    } catch {
      setRateStatus({
        kind: "error",
        message: "Não foi possível atualizar agora. Informe a cotação do yuan manualmente.",
      });
    } finally {
      setLoadingRate(false);
    }
  }

  const configFields: Array<{ key: keyof CSSBuyConfig; label: string; suffix: string }> = [
    { key: "importTaxPercent", label: "Imposto de importação", suffix: "%" },
    { key: "icmsPercent", label: "ICMS", suffix: "%" },
    { key: "otherFeesPercent", label: "Outras taxas sobre a base", suffix: "%" },
    { key: "servicePercent", label: "Serviço CSSBuy (auto)", suffix: "%" },
    { key: "insurancePercent", label: "Seguro (auto)", suffix: "%" },
    { key: "freightPerKgCny", label: "Frete internacional por kg", suffix: "¥/kg" },
    { key: "maxWeightKg", label: "Peso máximo por remessa", suffix: "kg" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ENTRADAS */}
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <h2 className="text-lg font-bold">Pedido CSSBuy em yuan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Todos os valores de compra são informados em CNY (¥). A conversão para reais acontece uma
          única vez, no final, pela cotação do yuan.
        </p>

        <div className="mt-5 grid gap-4">
          <Field
            label="Valor do produto"
            badge="Obrigatório"
            prefix="¥"
            value={product}
            onChange={setProduct}
            hint="Preço pago ao vendedor chinês."
          />
          <Field
            label="Frete doméstico na China"
            prefix="¥"
            value={domesticShipping}
            onChange={setDomesticShipping}
            hint="Envio do vendedor até o armazém CSSBuy."
          />
          <Field
            label="Taxa de serviço CSSBuy"
            badge="Auto se zerado"
            prefix="¥"
            value={serviceFee}
            onChange={setServiceFee}
            hint={`Deixe em zero para estimar com ${config.servicePercent}% do produto (configurável).`}
          />
          <Field
            label="Outros custos na China"
            prefix="¥"
            value={otherChinaCosts}
            onChange={setOtherChinaCosts}
            hint="Embalagem, remoção de etiquetas, fotos extras, armazenagem."
          />

          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm font-semibold">Peso</Label>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                kg ou g
              </span>
            </div>
            <div className="mt-3 flex items-stretch gap-2">
              <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-input bg-background/60">
                <Input
                  value={weight}
                  inputMode="decimal"
                  onChange={(event) => setWeight(event.target.value)}
                  className="h-11 rounded-none border-0 bg-transparent text-base font-semibold shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex overflow-hidden rounded-lg border border-input">
                {(["kg", "g"] as WeightUnit[]).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setWeightUnit(unit)}
                    className={`cursor-pointer px-4 text-sm font-bold transition-colors ${
                      weightUnit === unit
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/60 text-muted-foreground hover:bg-surface"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Peso usado no cálculo: {result.weightKg} kg (gramas são convertidos automaticamente).
            </p>
          </div>

          <Field
            label="Frete internacional"
            badge="Auto se zerado"
            prefix="¥"
            value={internationalShipping}
            onChange={setInternationalShipping}
            hint={`Deixe em zero para estimar com ${config.freightPerKgCny} ¥/kg (configurável).`}
          />
          <Field
            label="Seguro"
            badge="Auto se zerado"
            prefix="¥"
            value={insurance}
            onChange={setInsurance}
            hint={`Deixe em zero para estimar com ${config.insurancePercent}% do valor declarado.`}
          />
          <Field
            label="Valor declarado"
            prefix="¥"
            value={declaredValue}
            onChange={setDeclaredValue}
            hint="Base dos impostos. Declare sempre o valor real da compra."
          />
          <Field
            label="Outras taxas"
            prefix="¥"
            value={otherFees}
            onChange={setOtherFees}
            hint="Despacho, armazenagem no Brasil, encargos do courier."
          />
          <Field
            label="Quantidade de peças"
            suffix="peças"
            value={pieces}
            onChange={setPieces}
            hint="Usado para calcular o custo por peça."
          />

          {/* COTAÇÃO */}
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm font-semibold">Cotação do Yuan</Label>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Editável
              </span>
            </div>
            <div className="mt-3 flex items-stretch overflow-hidden rounded-lg border border-input bg-background/60">
              <span className="grid place-items-center border-r border-input px-3 text-sm font-semibold text-muted-foreground">
                R$
              </span>
              <Input
                value={rate}
                inputMode="decimal"
                onChange={(event) => setRate(event.target.value)}
                className="h-11 rounded-none border-0 bg-transparent text-base font-semibold shadow-none focus-visible:ring-0"
              />
              <span className="grid place-items-center border-l border-input px-3 text-sm font-semibold text-muted-foreground">
                / ¥ 1
              </span>
            </div>
            <Button onClick={updateRate} disabled={loadingRate} className="mt-3 w-full font-bold">
              <RefreshCw className={loadingRate ? "animate-spin" : ""} />
              ATUALIZAR COTAÇÃO
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Cotação em uso: {rateFormat(result.cnyRate)} por yuan. A alteração manual sempre
              prevalece.
            </p>
            {rateStatus && (
              <p
                className={`mt-2 text-xs ${rateStatus.kind === "ok" ? "text-success" : "text-warning"}`}
              >
                {rateStatus.message}
              </p>
            )}
          </div>

          {/* CONFIGURAÇÕES */}
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <button
              type="button"
              onClick={() => setShowConfig((open) => !open)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                Configuração de impostos e taxas
              </span>
              <span className="text-xs text-muted-foreground">
                {showConfig ? "Fechar" : "Abrir"}
              </span>
            </button>
            {showConfig && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {configFields.map((field) => (
                  <div key={field.key}>
                    <Label className="text-xs text-muted-foreground">{field.label}</Label>
                    <div className="mt-1 flex items-stretch overflow-hidden rounded-lg border border-input bg-background/60">
                      <Input
                        value={String(config[field.key])}
                        inputMode="decimal"
                        onChange={(event) =>
                          setConfig((current) => ({
                            ...current,
                            [field.key]: toNumber(event.target.value),
                          }))
                        }
                        className="h-10 rounded-none border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
                      />
                      <span className="grid place-items-center border-l border-input px-2 text-xs text-muted-foreground">
                        {field.suffix}
                      </span>
                    </div>
                  </div>
                ))}
                <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={config.taxShipping}
                    onChange={(event) =>
                      setConfig((current) => ({ ...current, taxShipping: event.target.checked }))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Incluir o frete internacional na base tributável
                </label>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Nenhuma alíquota é fixa no código. Ajuste sempre que a regra tributária ou o
                  contrato do intermediador mudar.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RESULTADO */}
      <section className="grid content-start gap-4">
        <div className="surface-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-lg font-bold">Custo final estimado</h2>

          <div className="mt-4 rounded-2xl bg-primary p-5 text-primary-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">
              Custo final em reais
            </p>
            <p className="mt-1 text-4xl font-black">{formatBRL(result.totalBrl)}</p>
            <p className="mt-2 text-sm font-bold opacity-90">
              {cnyFormat(result.totalCny)} · cotação {rateFormat(result.cnyRate)}
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <ResultRow label="Produto" value={formatBRL(result.productBrl)} />
            <ResultRow
              label="Frete China (doméstico + outros)"
              value={formatBRL(result.domesticShippingBrl + result.otherChinaCostsBrl)}
            />
            <ResultRow label="Taxa CSSBuy" value={formatBRL(result.serviceFeeBrl)} />
            <ResultRow
              label="Frete internacional"
              value={formatBRL(result.internationalShippingBrl)}
            />
            <ResultRow label="Seguro" value={formatBRL(result.insuranceBrl)} />
            <ResultRow
              label={`Impostos (II ${config.importTaxPercent}% + ICMS ${config.icmsPercent}%)`}
              value={formatBRL(result.taxesBrl)}
            />
            <ResultRow label="Outras taxas" value={formatBRL(result.otherFeesBrl)} />
            <ResultRow label="CUSTO FINAL" value={formatBRL(result.totalBrl)} strong />
            <ResultRow
              label={`CUSTO POR PEÇA (${result.pieces})`}
              value={formatBRL(result.costPerPieceBrl)}
              strong
            />
          </div>

          <div className="mt-4 grid gap-2">
            <ResultRow label="Custos na China (¥)" value={cnyFormat(result.chinaSubtotalCny)} />
            <ResultRow label="Base tributável (¥)" value={cnyFormat(result.taxableBaseCny)} />
            <ResultRow label="Custo por peça (¥)" value={cnyFormat(result.costPerPieceCny)} />
            <ResultRow label="Peso considerado" value={`${result.weightKg} kg`} />
          </div>
        </div>

        {/* TRANSPARÊNCIA */}
        <div className="surface-card rounded-2xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Calculator className="h-5 w-5 text-primary" />
            Como o custo foi formado
          </h2>
          <ol className="mt-4 grid gap-2">
            {result.steps.map((step) => (
              <li key={step.id} className="rounded-xl border border-border bg-surface/40 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">{step.label}</span>
                  <span className="text-sm font-bold text-primary">{step.value}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{step.formula}</p>
              </li>
            ))}
          </ol>
        </div>

        {result.warnings.length > 0 && (
          <div className="rounded-2xl border border-warning/40 bg-warning/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-warning">
              <AlertTriangle className="h-4 w-4" />
              Atenção
            </p>
            <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
              {result.warnings.map((warning) => (
                <li key={warning}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="flex items-start gap-2 rounded-2xl border border-border bg-surface/40 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Motor de cálculo próprio da CSSBuy, independente da USCloser. Resultado meramente
          estimativo: alíquotas, frete e serviço variam por remessa e pela regra fiscal vigente.
          Declare sempre o valor real da compra.
        </p>
      </section>
    </div>
  );
}
