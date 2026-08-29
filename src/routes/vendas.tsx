import { createFileRoute } from "@tanstack/react-router";

import { SalesPanel } from "@/features/vendas/sales-panel";

const title = "Vendas — Atlas Store";
const description =
  "Registro de vendas da Atlas Store com receita, custo real, lucro e divisão configurável entre disponível e reinvestimento.";

export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SalesPanel,
});
