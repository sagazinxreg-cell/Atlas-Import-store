import { createFileRoute } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Financeiro — Atlas Store";
const description =
  "Caixa, capital investido, lucro disponível e reinvestimento da Atlas Store em um só lugar.";

export const Route = createFileRoute("/financeiro")({
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
      title="Financeiro"
      description="Fluxo de caixa da operação: entradas, saídas, capital e reinvestimento."
      icon={Wallet}
      upcoming={[
        "Entradas e saídas de caixa",
        "Aportes de capital",
        "Divisão entre lucro e reinvestimento",
        "Relatórios por período",
      ]}
    />
  ),
});
