import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Produtos — Atlas Store";
const description =
  "Catálogo e estoque da Atlas Store: roupas, tênis e acessórios com custo, preço e margem.";

export const Route = createFileRoute("/produtos")({
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
      eyebrow="Operação"
      title="Produtos"
      description="Catálogo com estoque, custo unitário, preço de venda e margem por peça."
      icon={Package}
      upcoming={[
        "Cadastro de produtos e variações (tamanho/cor)",
        "Controle de estoque por lote",
        "Custo unitário e preço sugerido",
        "Filtros por categoria e status",
      ]}
    />
  ),
});
