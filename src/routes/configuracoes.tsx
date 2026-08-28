import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

import { ModulePlaceholder } from "@/components/layout/module-placeholder";

const title = "Configurações — Atlas Store";
const description =
  "Preferências da Atlas Store: parâmetros de margem, moedas, integrações e acesso ao sistema.";

export const Route = createFileRoute("/configuracoes")({
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
      title="Configurações"
      description="Parâmetros globais que alimentarão as calculadoras e relatórios."
      icon={Settings}
      upcoming={[
        "Parâmetros de margem e markup padrão",
        "Cotação de moedas e frete padrão",
        "Autenticação e acesso privado",
        "Preferências de exibição",
      ]}
    />
  ),
});
