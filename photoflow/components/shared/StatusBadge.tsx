import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" }> = {
  novo: { label: "Novo", variant: "info" },
  em_atendimento: { label: "Em Atendimento", variant: "warning" },
  foto_pendente: { label: "Foto Pendente", variant: "secondary" },
  foto_entregue: { label: "Foto Entregue", variant: "success" },
  finalizado: { label: "Finalizado", variant: "default" },
  upload_pendente: { label: "Upload Pendente", variant: "secondary" },
  processando: { label: "Processando", variant: "warning" },
  pronta: { label: "Pronta", variant: "info" },
  impressa: { label: "Impressa", variant: "success" },
  entregue: { label: "Entregue", variant: "default" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
