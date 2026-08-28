import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Histórico — Atlas Store";
const description =
  "Linha do tempo das operações da Atlas Store: importações, vendas, metas e movimentações.";

export const Route = createFileRoute("/historico")({
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
      eyebrow="Sistema"
      title="Histórico"
      description="Registro cronológico de tudo que acontece na operação."
      icon={History}
      upcoming={[
        "Timeline de eventos",
        "Filtros por tipo e data",
        "Auditoria de alterações",
        "Exportação de relatórios",
      ]}
    />
  ),
});
