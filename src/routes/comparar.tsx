import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/layout/page-header";
import { ComparePanel } from "@/features/comparar/compare-panel";

const title = "Comparar importação: USCloser x CSSBuy — Atlas Store";
const description =
  "Compare em reais o custo do mesmo produto pela rota USCloser (🇺🇸) e CSSBuy (🇨🇳): produto, frete, impostos, taxas, custo final e custo por peça, com a melhor opção destacada.";

export const Route = createFileRoute("/comparar")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CompararPage,
});

function CompararPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ferramenta"
        title="Comparar importação"
        description="Preencha as duas simulações e veja lado a lado qual rota entrega o menor custo final. Cálculos independentes — estimativa."
      />
      <ComparePanel />
    </>
  );
}
