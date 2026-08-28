import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { USCloserCalculatorPanel } from "@/features/uscloser/uscloser-calculator-panel";

const title = "Calculadora USCloser — Atlas Store";
const description =
  "Estime o custo final em reais de uma importação USCloser: produto, frete, serviço, imposto de importação, ICMS e outras taxas configuráveis.";

export const Route = createFileRoute("/uscloser")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: USCloserPage,
});

function USCloserPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        eyebrow="Operação"
        title="🇺🇸 USCloser → Brasil"
        description="Simule o custo real de uma remessa dos Estados Unidos. Todas as alíquotas são configuráveis e o resultado é uma estimativa."
      />
      <USCloserCalculatorPanel />
    </div>
  );
}
