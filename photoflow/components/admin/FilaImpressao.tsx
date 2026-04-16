"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCheck,
  CheckCircle2,
  Filter,
  Layers3,
  type LucideIcon,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Foto {
  id: string;
  fotoUrl: string;
  status: { id: string; status: string };
  lead: { id: string; nome: string; telefone: string };
  createdAt: string;
}

const FILTER_OPTIONS = {
  pronta: {
    label: "Prontas",
    description: "Fotos liberadas para a próxima rodada de impressão.",
  },
  impressa: {
    label: "Impressas",
    description: "Lotes já enviados para impressão recentemente.",
  },
  entregue: {
    label: "Entregues",
    description: "Fotos concluídas e entregues ao cliente final.",
  },
} as const;

const STATUS_STYLES = {
  pronta: {
    label: "Pronta",
    className: "border-transparent bg-[#18BDD5] text-[#04121f]",
  },
  impressa: {
    label: "Impressa",
    className: "border-transparent bg-[#1599BD] text-white",
  },
  entregue: {
    label: "Entregue",
    className: "border-white/10 bg-white/10 text-white",
  },
} as const;

const createdAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatCreatedAt(value: string) {
  return createdAtFormatter.format(new Date(value)).replace(",", " ·");
}

export function FilaImpressao() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<keyof typeof FILTER_OPTIONS>("pronta");

  const fetchFotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fotos?status=${filter}`);
      if (!res.ok) {
        throw new Error("Erro ao buscar fotos");
      }
      const data = await res.json();
      setFotos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao buscar fotos");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void fetchFotos();
  }, [fetchFotos]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (fotos.length > 0 && selected.size === fotos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(fotos.map((f) => f.id)));
    }
  };

  const handlePrint = async () => {
    const selectedFotos = fotos.filter((f) => selected.has(f.id));
    if (selectedFotos.length === 0) {
      toast.error("Selecione pelo menos uma foto");
      return;
    }

    // Open print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Habilite popups para imprimir");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão PhotoFlow</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px; }
              .photo-item { page-break-inside: avoid; }
              .photo-item img { width: 100%; height: auto; }
              .photo-info { font-size: 10px; text-align: center; margin-top: 4px; }
            }
            body { font-family: sans-serif; margin: 0; background: #ffffff; color: #0B284F; }
            .print-header { padding: 16px 8px 0; font-weight: 700; font-size: 18px; }
            .print-subtitle { padding: 0 8px 8px; font-size: 12px; color: #4b5563; }
            .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px; }
            .photo-item img { width: 100%; height: auto; }
            .photo-info { font-size: 12px; text-align: center; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="print-header">PhotoFlow</div>
          <div class="print-subtitle">Casa da Gráfica · Lote de impressão</div>
          <div class="photo-grid">
            ${selectedFotos
              .map(
                (f) => `
              <div class="photo-item">
                <img src="/api/fotos/${f.id}/image" alt="Foto" />
                <div class="photo-info">${f.lead.nome}</div>
              </div>
            `
              )
              .join("")}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();

    for (const fotoId of selected) {
      try {
        const foto = fotos.find((f) => f.id === fotoId);
        if (foto) {
          await fetch(`/api/fotos/${fotoId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusId: foto.status.id }),
          });
        }
      } catch {
        // ignore individual errors
      }
    }

    toast.success(`${selected.size} foto(s) enviadas para impressão`);
    setSelected(new Set());
    await fetchFotos();
  };

  const filterMeta = FILTER_OPTIONS[filter];
  const allSelected = fotos.length > 0 && selected.size === fotos.length;

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      <section className="rounded-3xl border border-white/10 bg-[#08192a]/80 p-4 shadow-[0_28px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-3 xl:flex-1">
            <MetricCard
              icon={Layers3}
              label="Na fila"
              value={String(fotos.length)}
              helper={`${filterMeta.label} disponíveis agora`}
            />
            <MetricCard
              icon={CheckCheck}
              label="Selecionadas"
              value={String(selected.size)}
              helper={
                selected.size > 0
                  ? "Lote pronto para impressão"
                  : "Nenhuma foto selecionada"
              }
              accent={selected.size > 0}
            />
            <MetricCard
              icon={Filter}
              label="Status atual"
              value={filterMeta.label}
              helper={filterMeta.description}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:min-w-60">
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
                Filtrar por status
              </label>
              <Select value={filter} onValueChange={(value) => setFilter(value as keyof typeof FILTER_OPTIONS)}>
                <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-white/4 text-white shadow-none ring-offset-transparent focus:ring-[#18BDD5] dark:border-white/10 dark:bg-white/4 dark:text-white dark:focus:ring-[#18BDD5]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#08192a] text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#08192a] dark:text-white">
                  <SelectItem value="pronta" className="text-white focus:bg-white/8 focus:text-white dark:focus:bg-white/8">
                    Prontas
                  </SelectItem>
                  <SelectItem value="impressa" className="text-white focus:bg-white/8 focus:text-white dark:focus:bg-white/8">
                    Impressas
                  </SelectItem>
                  <SelectItem value="entregue" className="text-white focus:bg-white/8 focus:text-white dark:focus:bg-white/8">
                    Entregues
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={selectAll}
              disabled={fotos.length === 0}
              className="h-11 rounded-2xl border-white/10 bg-white/4 px-4 text-slate-200 shadow-none hover:bg-white/8 hover:text-white dark:border-white/10 dark:bg-white/4 dark:text-slate-200 dark:hover:bg-white/8"
            >
              {allSelected ? "Desmarcar todas" : "Selecionar todas"}
            </Button>

            <Button
              type="button"
              onClick={handlePrint}
              disabled={selected.size === 0}
              className="hidden h-11 rounded-2xl bg-linear-to-r from-[#18BDD5] to-[#1599BD] px-5 text-[#04121f] shadow-[0_18px_34px_rgba(24,189,213,0.22)] hover:from-[#18BDD5] hover:to-[#1599BD] md:inline-flex"
            >
              <Printer className="h-4 w-4" />
              Imprimir lote
              <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold">
                {selected.size}
              </span>
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-3"
            >
              <Skeleton className="aspect-4/5 rounded-2xl bg-white/10" />
              <Skeleton className="mt-3 h-4 w-3/4 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-1/2 bg-white/10" />
            </div>
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-[#08192a]/70 px-6 py-12 text-center shadow-[0_28px_60px_rgba(0,0,0,0.22)] md:px-10 md:py-16">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#18BDD5]/14 text-[#18BDD5]">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h2 className="mt-5 text-xl font-semibold text-white">
            Nenhuma foto encontrada
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            Não há fotos no status {filterMeta.label.toLowerCase()} no momento. Assim que novos registros entrarem na fila, eles aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {fotos.map((foto) => (
            <button
              type="button"
              key={foto.id}
              className={cn(
                "group relative flex aspect-4/5 overflow-hidden rounded-3xl border bg-[#071322] text-left transition-all duration-200",
                selected.has(foto.id)
                  ? "border-[#18BDD5] ring-1 ring-[#18BDD5]/35 shadow-[0_20px_40px_rgba(24,189,213,0.16)]"
                  : "border-white/10 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_18px_38px_rgba(0,0,0,0.24)]"
              )}
              onClick={() => toggleSelect(foto.id)}
            >
              <Image
                src={`/api/fotos/${foto.id}/image`}
                alt={`Foto de ${foto.lead.nome}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 48vw, (max-width: 1280px) 30vw, 20vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-linear-to-t from-[#061321] via-[#061321]/42 to-transparent" />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
                <div
                  className="rounded-xl border border-white/10 bg-black/30 p-1 backdrop-blur-md"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSelect(foto.id);
                  }}
                >
                  <Checkbox
                    checked={selected.has(foto.id)}
                    onCheckedChange={() => toggleSelect(foto.id)}
                    className="h-5 w-5 rounded-md border-white/30 bg-transparent text-[#04121f] shadow-none focus-visible:ring-[#18BDD5] data-[state=checked]:border-[#18BDD5] data-[state=checked]:bg-[#18BDD5] data-[state=checked]:text-[#04121f]"
                  />
                </div>

                <StatusPill status={foto.status.status} />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="truncate text-sm font-semibold text-white">
                  {foto.lead.nome}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-300">
                  <span className="truncate">{foto.lead.telefone}</span>
                  <span className="shrink-0">{formatCreatedAt(foto.createdAt)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#071322]/92 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-screen-sm items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#18BDD5]">
              Selecionadas
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {selected.size} {selected.size === 1 ? "foto pronta" : "fotos prontas"}
            </p>
          </div>

          <Button
            type="button"
            onClick={handlePrint}
            disabled={selected.size === 0}
            className="h-11 flex-1 rounded-2xl bg-linear-to-r from-[#18BDD5] to-[#1599BD] text-[#04121f] shadow-[0_18px_34px_rgba(24,189,213,0.22)] hover:from-[#18BDD5] hover:to-[#1599BD]"
          >
            <Printer className="h-4 w-4" />
            {selected.size === 0 ? "Selecione fotos" : `Imprimir (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  accent = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  helper: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-[0_16px_32px_rgba(0,0,0,0.16)]",
        accent ? "border-[#18BDD5]/24 bg-[#0a2135]" : "border-white/10 bg-white/3"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{helper}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#18BDD5]/14 text-[#18BDD5]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config =
    STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? {
      label: status,
      className: "border-white/10 bg-white/10 text-white",
    };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-md",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
