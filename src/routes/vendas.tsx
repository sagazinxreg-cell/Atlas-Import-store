import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Vendas — Atlas Store";
const description =
  "Registro de vendas da Atlas Store com lucro por peça, formas de pagamento e desempenho por período.";

export const Route = createFileRoute("/vendas")({
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
      title="Vendas"
      description="Cada venda registrada com produto, valor, cliente e lucro realizado."
      icon={ShoppingBag}
      upcoming={[
        "Registro rápido de venda",
        "Lucro realizado por peça",
        "Formas de pagamento",
        "Desempenho por período",
      ]}
    />
  ),
});
