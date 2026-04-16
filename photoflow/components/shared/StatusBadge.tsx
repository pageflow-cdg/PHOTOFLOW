const statusConfig: Record<string, { label: string; className: string }> = {
  novo:            { label: "Novo",            className: "bg-[#18BDD5]/15 text-[#18BDD5] border border-[#18BDD5]/30" },
  em_atendimento:  { label: "Em Atendimento",  className: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
  foto_pendente:   { label: "Foto Pendente",   className: "bg-slate-500/15 text-slate-400 border border-slate-500/30" },
  foto_entregue:   { label: "Foto Entregue",   className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
  finalizado:      { label: "Finalizado",      className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
  upload_pendente: { label: "Upload Pendente", className: "bg-slate-500/15 text-slate-400 border border-slate-500/30" },
  processando:     { label: "Processando",     className: "bg-amber-500/15 text-amber-400 border border-amber-500/30" },
  pronta:          { label: "Pronta",          className: "bg-[#18BDD5]/15 text-[#18BDD5] border border-[#18BDD5]/30" },
  impressa:        { label: "Impressa",        className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
  entregue:        { label: "Entregue",        className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: "bg-white/8 text-white/50 border border-white/15" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
