import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PROFIT_SPLIT } from "@/lib/database";

export type FinanceMetric = {
  id: string;
  label: string;
  value: number;
  hint: string;
  emphasis?: "primary" | "positive" | "neutral";
};

export type DashboardGoal = {
  name: string;
  targetValue: number;
  currentValue: number;
  averageTicket: number;
};

export type MonthPoint = { month: string; receita: number; lucro: number };

export type DashboardData = {
  metrics: FinanceMetric[];
  goal: DashboardGoal | null;
  monthly: MonthPoint[];
  counts: { importations: number; products: number; sales: number };
};

const MONTH_LABELS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function lastSixMonths(): { key: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: MONTH_LABELS[d.getMonth()]!,
    };
  });
}

async function fetchDashboard(): Promise<DashboardData> {
  const [importations, products, sales, settings, goals] = await Promise.all([
    supabase.from("importations").select("total_cost, status"),
    supabase.from("products").select("quantity, sale_price, total_cost"),
    supabase.from("sales").select("date, total_revenue, gross_profit, available_profit, reinvestment_profit"),
    supabase
      .from("settings")
      .select("available_profit_percentage, reinvestment_percentage")
      .maybeSingle(),
    supabase
      .from("goals")
      .select("name, target_amount, current_amount, average_ticket, status")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const firstError =
    importations.error ?? products.error ?? sales.error ?? settings.error ?? goals.error;
  if (firstError) throw new Error(firstError.message);

  const activeImports = (importations.data ?? []).filter((i) => i.status !== "cancelled");
  const investedCapital = activeImports.reduce((sum, i) => sum + Number(i.total_cost ?? 0), 0);
  const receivedCost = activeImports
    .filter((i) => i.status === "received")
    .reduce((sum, i) => sum + Number(i.total_cost ?? 0), 0);
  const totalCost = receivedCost > 0 ? receivedCost : investedCapital;

  const stock = products.data ?? [];
  const potentialRevenue = stock.reduce(
    (sum, p) => sum + Number(p.quantity ?? 0) * Number(p.sale_price ?? 0),
    0,
  );
  const stockCost = stock.reduce(
    (sum, p) => sum + Number(p.quantity ?? 0) * Number(p.total_cost ?? 0),
    0,
  );
  const potentialProfit = potentialRevenue - (stockCost > 0 ? stockCost : totalCost);

  const availablePct = Number(settings.data?.available_profit_percentage ?? DEFAULT_PROFIT_SPLIT.available);
  const reinvestPct = Number(settings.data?.reinvestment_percentage ?? DEFAULT_PROFIT_SPLIT.reinvestment);

  const salesRows = sales.data ?? [];
  const realizedProfit = salesRows.reduce((sum, s) => sum + Number(s.gross_profit ?? 0), 0);
  const realizedAvailable = salesRows.reduce((sum, s) => sum + Number(s.available_profit ?? 0), 0);
  const realizedReinvest = salesRows.reduce((sum, s) => sum + Number(s.reinvestment_profit ?? 0), 0);

  const availableProfit = realizedProfit > 0 ? realizedAvailable : (potentialProfit * availablePct) / 100;
  const reinvestment = realizedProfit > 0 ? realizedReinvest : (potentialProfit * reinvestPct) / 100;

  const buckets = new Map(lastSixMonths().map((m) => [m.key, { month: m.label, receita: 0, lucro: 0 }]));
  for (const sale of salesRows) {
    const key = String(sale.date ?? "").slice(0, 7);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.receita += Number(sale.total_revenue ?? 0);
    bucket.lucro += Number(sale.gross_profit ?? 0);
  }

  const metrics: FinanceMetric[] = [
    {
      id: "capital",
      label: "Capital investido",
      value: investedCapital,
      hint: "Total aplicado nas importações ativas",
      emphasis: "neutral",
    },
    {
      id: "import-cost",
      label: "Custo total",
      value: totalCost,
      hint: "Custo real das importações",
    },
    {
      id: "potential-revenue",
      label: "Receita potencial",
      value: potentialRevenue,
      hint: "Estoque disponível × preço de venda",
      emphasis: "primary",
    },
    {
      id: "potential-profit",
      label: "Lucro potencial",
      value: potentialProfit,
      hint: "Receita potencial - custo real",
      emphasis: "positive",
    },
    {
      id: "available-profit",
      label: "Lucro disponível",
      value: availableProfit,
      hint: `${availablePct}% do lucro para retirada`,
      emphasis: "positive",
    },
    {
      id: "reinvestment",
      label: "Reinvestimento",
      value: reinvestment,
      hint: `${reinvestPct}% do lucro reservado`,
    },
  ];

  return {
    metrics,
    goal: goals.data
      ? {
          name: goals.data.name,
          targetValue: Number(goals.data.target_amount ?? 0),
          currentValue: Number(goals.data.current_amount ?? 0),
          averageTicket: Number(goals.data.average_ticket ?? 0),
        }
      : null,
    monthly: [...buckets.values()],
    counts: {
      importations: activeImports.length,
      products: stock.length,
      sales: salesRows.length,
    },
  };
}

export function useDashboardData() {
  return useQuery({ queryKey: ["dashboard"], queryFn: fetchDashboard, retry: false });
}
