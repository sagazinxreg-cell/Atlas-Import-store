import { createFileRoute } from "@tanstack/react-router";
import { Ship } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Importações — Atlas Store";
const description =
  "Controle de lotes de importação da Atlas Store: custos, frete, status de envio e rentabilidade por remessa.";

export const Route = createFileRoute("/importacoes")({
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
      title="Importações"
      description="Cada lote importado, do pedido ao recebimento, com custos e resultado consolidado."
      icon={Ship}
      upcoming={[
        "Cadastro de lotes de importação",
        "Composição de custos (produto, frete, taxas)",
        "Status de envio e recebimento",
        "Rentabilidade por lote",
      ]}
    />
  ),
});
