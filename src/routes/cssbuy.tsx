import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { CSSBuyCalculatorPanel } from "@/features/cssbuy/cssbuy-calculator-panel";

const title = "Calculadora CSSBuy — Atlas Store";
const description =
  "Estime em reais o custo de uma importação CSSBuy: produto, frete na China, taxa de serviço, frete internacional, seguro, impostos configuráveis e custo por peça.";

export const Route = createFileRoute("/cssbuy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CSSBuyPage,
});

function CSSBuyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title="🇨🇳 CSSBuy → Brasil"
        description="Compras em yuan (¥) com motor de cálculo próprio, independente da USCloser. Peso em kg ou g, alíquotas configuráveis e resultado estimativo."
      />
      <CSSBuyCalculatorPanel />
    </div>
  );
}
