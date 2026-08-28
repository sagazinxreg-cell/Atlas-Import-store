import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, Info, RefreshCw, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/format";
import {
  DEFAULT_USCLOSER_CONFIG,
  USCloserCalculator,
  type USCloserConfig,
} from "./calculator";
import { fetchCommercialUsdRate } from "./exchange-rate";

const usdFormat = (value: number) =>
  `US$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

function toNumber(value: string): number {
  const clean = value.replace(/\s/g, "");
  // Se houver vírgula, ela é o separador decimal e o ponto é milhar.
  const normalized = clean.includes(",")
    ? clean.replace(/\./g, "").replace(",", ".")
    : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

const rateFormat = (value: number) =>
  `R$ ${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)}`;


function Field({
  label,
  hint,
  badge,
  prefix,
  suffix,
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
}: {
  label: string;
  hint?: string;
  badge?: string;
  prefix?: string;
  suffix?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
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
          inputMode={inputMode}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 rounded-none border-0 bg-transparent text-base font-semibold shadow-none focus-visible:ring-0"
        />
        {suffix && (
          <span className="grid place-items-center border-l border-input px-3 text-sm font-semibold text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 rounded-xl border border-border bg-surface/40 px-4 py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={strong ? "text-lg font-bold text-primary" : "text-base font-semibold"}>{value}</span>
    </div>
  );
}

export function USCloserCalculatorPanel() {
  const [paid, setPaid] = useState("0.00");
  const [declared, setDeclared] = useState("0.00");
  const [declaredTouched, setDeclaredTouched] = useState(false);
  const [weight, setWeight] = useState("1");
  const [declaredShipping, setDeclaredShipping] = useState("0.00");
  const [brazilPrice, setBrazilPrice] = useState("");
  const [rate, setRate] = useState("5.4000");
  const [rateStatus, setRateStatus] = useState<null | { kind: "ok" | "error"; message: string }>(null);
  const [loadingRate, setLoadingRate] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<USCloserConfig>(DEFAULT_USCLOSER_CONFIG);

  // O valor declarado acompanha o valor pago até o usuário editar o campo.
  useEffect(() => {
    if (!declaredTouched) setDeclared(paid);
  }, [paid, declaredTouched]);

  const result = useMemo(
    () =>
      USCloserCalculator.calculate(
        {
          paidProductUsd: toNumber(paid),
          declaredProductUsd: toNumber(declared),
          weightLb: toNumber(weight),
          declaredShippingUsd: toNumber(declaredShipping),
          brazilPriceBrl: brazilPrice.trim() === "" ? null : toNumber(brazilPrice),
          commercialRate: toNumber(rate),
        },
        config,
      ),
    [paid, declared, weight, declaredShipping, brazilPrice, rate, config],
  );

  async function updateRate() {
    setLoadingRate(true);
    try {
      const value = await fetchCommercialUsdRate();
      setRate(value.toFixed(4));
      setRateStatus({ kind: "ok", message: "Cotação atualizada agora." });
    } catch {
      setRateStatus({
        kind: "error",
        message: "Não foi possível atualizar agora. Você pode informar o dólar manualmente.",
      });
    } finally {
      setLoadingRate(false);
    }
  }

  const configFields: Array<{ key: keyof USCloserConfig; label: string; suffix: string }> = [
    { key: "importTaxPercent", label: "Imposto de importação", suffix: "%" },
    { key: "icmsPercent", label: "ICMS", suffix: "%" },
    { key: "otherFeesPercent", label: "Outras taxas", suffix: "%" },
    { key: "freightRatePerLbUsd", label: "Frete real por libra", suffix: "US$/lb" },
    { key: "servicePercent", label: "Serviço do intermediador", suffix: "%" },
    { key: "operatorRateSpread", label: "Spread do dólar da operação", suffix: "×" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* ENTRADAS */}
      <section className="surface-card rounded-2xl p-5 sm:p-6">
        <h2 className="text-lg font-bold">Dados da compra e declaração</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          O valor pago entra no custo real. O valor declarado entra na base dos impostos.
        </p>

        <div className="mt-5 grid gap-4">
          <Field
            label="Valor pago pelo produto"
            badge="Obrigatório"
            prefix="US$"
            value={paid}
            onChange={setPaid}
            hint="Valor real desembolsado na compra."
          />
          <Field
            label="Valor declarado do produto"
            badge={declaredTouched ? "Editado" : "Segue o valor pago"}
            prefix="US$"
            value={declared}
            onChange={(value) => {
              setDeclaredTouched(true);
              setDeclared(value);
            }}
            hint="Declare sempre o valor real da compra. Este campo define a base tributária."
          />
          <Field
            label="Peso considerado no envio"
            badge={`Obrigatório · padrão 1 lb`}
            suffix="lb"
            value={weight}
            onChange={setWeight}
            hint={`Informe no máximo ${config.maxWeightLb} lb.`}
          />
          <Field
            label="Frete declarado"
            badge="Opcional"
            prefix="US$"
            value={declaredShipping}
            onChange={setDeclaredShipping}
            hint="Zero significa frete não declarado."
          />
          <Field
            label="Valor do item no Brasil"
            badge="Opcional"
            prefix="R$"
            value={brazilPrice}
            onChange={setBrazilPrice}
            placeholder="Digite para comparar"
            hint="Usado somente na comparação de economia."
          />

          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="text-sm font-semibold">Dólar comercial</Label>
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
            </div>
            <Button onClick={updateRate} disabled={loadingRate} className="mt-3 w-full font-bold">
              <RefreshCw className={loadingRate ? "animate-spin" : ""} />
              ATUALIZAR DÓLAR
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Dólar da operação = comercial × {config.operatorRateSpread} ={" "}
              {rateFormat(result.operatorRate)}
            </p>
            {rateStatus && (
              <p
                className={`mt-2 text-xs ${rateStatus.kind === "ok" ? "text-success" : "text-warning"}`}
              >
                {rateStatus.message}
              </p>
            )}
          </div>

          {/* CONFIGURAÇÃO DE ALÍQUOTAS */}
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
              <span className="text-xs text-muted-foreground">{showConfig ? "Fechar" : "Abrir"}</span>
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
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  As alíquotas podem mudar. Ajuste aqui sempre que a regra tributária for atualizada.
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
              Total pago em reais
            </p>
            <p className="mt-1 text-4xl font-black">{formatBRL(result.totalBrl)}</p>
            <p className="mt-2 text-xs font-medium opacity-80">
              Produto, frete real e serviço usam o dólar da operação. Os impostos usam o dólar comercial.
            </p>
          </div>

          <div className="mt-4 grid gap-2">
            <ResultRow label="Produto" value={formatBRL(result.productBrl)} />
            <ResultRow label="Frete real" value={formatBRL(result.freightBrl)} />
            <ResultRow label="Serviço do intermediador" value={formatBRL(result.serviceBrl)} />
            <ResultRow
              label={`Imposto de importação ${config.importTaxPercent}%`}
              value={formatBRL(result.importTaxBrl)}
            />
            <ResultRow label={`ICMS ${config.icmsPercent}%`} value={formatBRL(result.icmsBrl)} />
            <ResultRow
              label={`Outras taxas ${config.otherFeesPercent}%`}
              value={formatBRL(result.otherFeesBrl)}
            />
            <ResultRow label="Custo total" value={formatBRL(result.totalBrl)} strong />
          </div>

          <div className="mt-4 grid gap-2">
            <ResultRow label="Base tributável declarada" value={usdFormat(result.taxableBaseUsd)} />
            <ResultRow label="Total em dólares" value={usdFormat(result.totalUsd)} />
            <ResultRow
              label="Valor no Brasil"
              value={result.brazilPriceBrl != null ? formatBRL(result.brazilPriceBrl) : "Não informado"}
            />
            <ResultRow
              label="Economia estimada"
              value={
                result.savingsBrl != null && result.savingsPercent != null
                  ? `${formatBRL(result.savingsBrl)} (${result.savingsPercent.toFixed(1)}%)`
                  : "-"
              }
            />
          </div>
        </div>

        {/* TRANSPARÊNCIA */}
        <div className="surface-card rounded-2xl p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Calculator className="h-5 w-5 text-primary" />
            Como o cálculo foi feito
          </h2>
          <ol className="mt-4 grid gap-2">
            {result.steps.map((step, index) => (
              <li key={step.id} className="rounded-xl border border-border bg-surface/40 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-semibold">
                    {index + 1}. {step.label}
                  </span>
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
          Resultado meramente estimativo. Alíquotas, frete e serviço variam por remessa e por regra
          fiscal vigente. Declare sempre o valor real da compra.
        </p>
      </section>
    </div>
  );
}
