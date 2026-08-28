import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Metas — Atlas Store";
const description =
  "Metas de faturamento e reinvestimento da Atlas Store com progresso e peças necessárias.";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Financeiro"
      title="Metas"
      description="Definição e acompanhamento das metas da loja, incluindo a meta ativa do dashboard."
      icon={Target}
      upcoming={[
        "Criação de metas por valor e prazo",
        "Progresso automático a partir das vendas",
        "Cálculo de peças necessárias",
        "Histórico de metas concluídas",
      ]}
    />
  ),
});
