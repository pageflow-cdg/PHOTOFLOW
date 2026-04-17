"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  User,
  Phone,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CloserItem {
  id: string;
  leadId: string;
  lead: {
    id: string;
    nome: string;
    telefone: string;
    status: { id: string; status: string };
  };
  responsavel: { id: string; user: string };
  audioUrl: string | null;
  audioDuracao: number | null;
  transcricao: string | null;
  transcricaoStatus: string;
  erro: string | null;
  createdAt: string;
}

type FilterType = "todos" | "pendente" | "com_audio" | "transcrito";

const FILTER_OPTIONS: Record<FilterType, { label: string; description: string }> = {
  todos: { label: "Todos", description: "Todos os atendimentos de closer" },
  pendente: { label: "Sem Áudio", description: "Aguardando gravação de áudio" },
  com_audio: { label: "Com Áudio", description: "Áudio enviado, transcrevendo ou concluído" },
  transcrito: { label: "Transcritos", description: "Transcrição concluída" },
};

const transcricaoIcons: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  pendente: { icon: <FileText className="h-3.5 w-3.5" />, className: "text-slate-400", label: "Sem áudio" },
  processando: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, className: "text-amber-400", label: "Transcrevendo" },
  concluida: { icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: "text-emerald-400", label: "Transcrito" },
  erro: { icon: <AlertCircle className="h-3.5 w-3.5" />, className: "text-red-400", label: "Erro" },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value)).replace(",", " ·");
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function CloserList() {
  const [closers, setClosers] = useState<CloserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("todos");
  const router = useRouter();

  const fetchClosers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/closer");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClosers(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao buscar closers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClosers();
  }, [fetchClosers]);

  const filtered = closers.filter((c) => {
    if (filter === "pendente") return !c.audioUrl;
    if (filter === "com_audio") return !!c.audioUrl;
    if (filter === "transcrito") return c.transcricaoStatus === "concluida";
    return true;
  });

  const counts = {
    todos: closers.length,
    pendente: closers.filter((c) => !c.audioUrl).length,
    com_audio: closers.filter((c) => !!c.audioUrl).length,
    transcrito: closers.filter((c) => c.transcricaoStatus === "concluida").length,
  };

  return (
    <div className="space-y-5 pb-24 md:space-y-6 md:pb-0">
      {/* Filters */}
      <section className="rounded-3xl border border-white/10 bg-[#08192a]/80 p-4 shadow-[0_28px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-4 xl:flex-1">
            {(Object.entries(FILTER_OPTIONS) as [FilterType, { label: string; description: string }][]).map(
              ([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "group relative flex flex-col gap-1 rounded-2xl border p-4 text-left transition-all duration-200",
                    filter === key
                      ? "border-violet-500/35 bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-[0_18px_40px_rgba(139,92,246,0.18)]"
                      : "border-white/8 bg-white/3 text-slate-300 hover:border-white/12 hover:bg-white/5"
                  )}
                >
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span
                    className={cn(
                      "text-xs",
                      filter === key ? "text-violet-100/70" : "text-slate-500"
                    )}
                  >
                    {meta.description}
                  </span>
                  <span
                    className={cn(
                      "absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      filter === key
                        ? "bg-white/20 text-white"
                        : "bg-white/8 text-white/50"
                    )}
                  >
                    {counts[key]}
                  </span>
                </button>
              )
            )}
          </div>

          <Button
            onClick={fetchClosers}
            variant="outline"
            className="rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </section>

      {/* List */}
      <section className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/4" />
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-white/3 py-16">
            <Mic className="h-10 w-10 text-white/20" />
            <p className="text-sm text-white/40">
              Nenhum atendimento de closer encontrado
            </p>
          </div>
        ) : (
          filtered.map((closer) => {
            const tConfig = transcricaoIcons[closer.transcricaoStatus] || transcricaoIcons.pendente;

            return (
              <button
                key={closer.id}
                onClick={() => router.push(`/admin/closer/${closer.id}`)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/3 p-4 text-left transition-all duration-200 hover:border-violet-500/25 hover:bg-white/5 hover:shadow-[0_12px_32px_rgba(139,92,246,0.08)]"
              >
                {/* Avatar / icon */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-violet-500/10 text-violet-400">
                  <Mic className="h-5 w-5" />
                </div>

                {/* Lead info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="truncate font-semibold text-white">
                      {closer.lead.nome}
                    </p>
                    <StatusBadge status={closer.lead.status.status} />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/45">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {closer.lead.telefone}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {closer.responsavel.user}
                    </span>
                    <span>{formatDate(closer.createdAt)}</span>
                  </div>
                </div>

                {/* Status / audio info */}
                <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                  {closer.audioUrl ? (
                    <>
                      <span className={cn("flex items-center gap-1 text-xs", tConfig.className)}>
                        {tConfig.icon}
                        {tConfig.label}
                      </span>
                      {closer.audioDuracao && (
                        <span className="text-xs text-white/30">
                          {formatDuration(closer.audioDuracao)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Mic className="h-3.5 w-3.5" />
                      Aguardando áudio
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 shrink-0 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
              </button>
            );
          })
        )}
      </section>
    </div>
  );
}
