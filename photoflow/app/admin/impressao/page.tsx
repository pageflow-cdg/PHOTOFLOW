import { FilaImpressao } from "@/components/admin/FilaImpressao";

export default function ImpressaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fila de Impressão</h1>
        <p className="text-zinc-500">Gerencie as fotos para impressão</p>
      </div>
      <FilaImpressao />
    </div>
  );
}
