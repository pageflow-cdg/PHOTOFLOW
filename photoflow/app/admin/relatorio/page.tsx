import { RelatorioCharts } from "@/components/admin/RelatorioCharts";

export default function RelatorioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatório</h1>
        <p className="text-zinc-500">Dashboard de métricas do evento</p>
      </div>
      <RelatorioCharts />
    </div>
  );
}
