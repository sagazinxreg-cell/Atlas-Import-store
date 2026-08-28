import { createFileRoute } from "@tanstack/react-router";

import { ProductsPanel } from "@/features/produtos/products-panel";

const title = "Produtos — Atlas Store";
const description =
  "Catálogo e estoque da Atlas Store: roupas, tênis e acessórios com custo real por peça, preço e margem.";

export const Route = createFileRoute("/produtos")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ProductsPanel,
});
