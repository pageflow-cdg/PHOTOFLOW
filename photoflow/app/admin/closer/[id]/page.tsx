"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { CloserRecorder } from "@/components/admin/CloserRecorder";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Phone,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface LeadCloserData {
  id: string;
  leadId: string;
  lead: {
    id: string;
    nome: string;
    telefone: string;
    status: { status: string };
  };
  responsavelId: string;
  responsavel: { id: string; user: string };
  audioUrl: string | null;
  audioDuracao: number | null;
  transcricao: string | null;
  transcricaoStatus: string;
  erro: string | null;
  createdAt: string;
}

const transcricaoStatusConfig: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pendente: {
    label: "Pendente",
    icon: <FileText className="h-4 w-4" />,
    className: "text-slate-400",
  },
  processando: {
    label: "Transcrevendo...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    className: "text-amber-400",
  },
  concluida: {
    label: "Concluída",
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: "text-emerald-400",
  },
  erro: {
    label: "Erro",
    icon: <AlertCircle className="h-4 w-4" />,
    className: "text-red-400",
  },
};

export default function CloserPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<LeadCloserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchCloser = useCallback(async () => {
    try {
      const res = await fetch(`/api/closer/${id}`);
      if (res.status === 403) {
        toast.error("Você não tem permissão para acessar este closer");
        router.push("/admin/closer");
        return;
      }
      if (!res.ok) {
        toast.error("Erro ao buscar dados do closer");
        return;
      }
      const result = await res.json();
      setData(result);
    } catch {
      toast.error("Erro ao buscar dados do closer");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchCloser();
  }, [fetchCloser]);

  // Poll for transcription status when processing
  useEffect(() => {
    if (data?.transcricaoStatus !== "processando") return;
    const interval = setInterval(fetchCloser, 3000);
    return () => clearInterval(interval);
  }, [data?.transcricaoStatus, fetchCloser]);

  const handleStatusChange = async (statusSlug: string) => {
    if (!data) return;
    setChangingStatus(true);
    try {
      // First get the status id
      const statusesRes = await fetch("/api/leads/statuses");
      const statuses: { id: string; status: string }[] =
        await statusesRes.json();
      const target = statuses.find((s) => s.status === statusSlug);
      if (!target) {
        toast.error("Status não encontrado");
        return;
      }

      const res = await fetch(`/api/leads/${data.leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: target.id }),
      });

      if (res.ok) {
        toast.success(
          `Status alterado para ${statusSlug.replace("_", " ")}`
        );
        fetchCloser();
      } else {
        toast.error("Erro ao alterar status");
      }
    } catch {
      toast.error("Erro ao alterar status");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleRetryTranscription = async () => {
    if (!data) return;
    try {
      const res = await fetch(`/api/closer/${data.id}/transcrever`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Transcrição reiniciada");
        fetchCloser();
      } else {
        toast.error("Erro ao reiniciar transcrição");
      }
    } catch {
      toast.error("Erro ao reiniciar transcrição");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#18BDD5]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-white/30" />
        <p className="text-white/50">Registro de closer não encontrado</p>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/closer")}
          className="rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
        >
          Voltar para Closer
        </Button>
      </div>
    );
  }

  const transcricaoConfig =
    transcricaoStatusConfig[data.transcricaoStatus] ||
    transcricaoStatusConfig.pendente;
  const isOwner =
    (session?.user as { id?: string })?.id === data.responsavelId;
  const isAdmin =
    (session?.user as { role?: string })?.role === "admin";
  const canInteract = isOwner || isAdmin;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/closer")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Closer</h1>
          <p className="text-sm text-white/45">
            Atendimento de lead pelo closer
          </p>
        </div>
      </div>

      {/* Lead info */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">
          Dados do Lead
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-3">
            <User className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-xs text-white/40">Nome</p>
              <p className="font-medium text-white">{data.lead.nome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-3">
            <Phone className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-xs text-white/40">Telefone</p>
              <p className="font-medium text-white">{data.lead.telefone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-3">
            <FileText className="h-4 w-4 text-white/40" />
            <div>
              <p className="text-xs text-white/40">Status</p>
              <StatusBadge status={data.lead.status.status} />
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/8 bg-white/4 p-3">
          <p className="text-xs text-white/40">
            Closer responsável:{" "}
            <span className="font-medium text-white">
              {data.responsavel.user}
            </span>
          </p>
        </div>
      </div>

      {/* Audio recorder / uploader */}
      {!data.audioUrl && canInteract && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">
            Áudio da Conversa
          </p>
          <CloserRecorder
            leadCloserId={data.id}
            onUploadComplete={fetchCloser}
            disabled={!canInteract}
          />
        </div>
      )}

      {/* Audio player (after upload) */}
      {data.audioUrl && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">
            Áudio Gravado
          </p>
          <audio controls src={data.audioUrl} className="w-full" />
          {data.audioDuracao && (
            <p className="mt-2 text-xs text-white/40">
              Duração: {Math.floor(data.audioDuracao / 60)}m{" "}
              {data.audioDuracao % 60}s
            </p>
          )}
        </div>
      )}

      {/* Transcription status + content */}
      {data.audioUrl && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">
              Transcrição
            </p>
            <div
              className={`flex items-center gap-1.5 text-xs ${transcricaoConfig.className}`}
            >
              {transcricaoConfig.icon}
              {transcricaoConfig.label}
            </div>
          </div>

          {data.transcricaoStatus === "processando" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#18BDD5]" />
              <p className="text-sm text-white/50">
                Transcrevendo áudio com IA...
              </p>
            </div>
          )}

          {data.transcricaoStatus === "concluida" && data.transcricao && (
            <div className="rounded-xl border border-white/6 bg-black/20 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                {data.transcricao}
              </p>
            </div>
          )}

          {data.transcricaoStatus === "erro" && (
            <div className="space-y-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-400">
                  {data.erro || "Erro desconhecido na transcrição"}
                </p>
              </div>
              {canInteract && (
                <Button
                  onClick={handleRetryTranscription}
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
              )}
            </div>
          )}

          {data.transcricaoStatus === "pendente" && (
            <p className="py-4 text-center text-sm text-white/40">
              Aguardando envio de áudio para transcrição
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      {canInteract && data.lead.status.status === "em_closer" && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => handleStatusChange("foto_pendente")}
            disabled={changingStatus}
            className="flex-1 rounded-xl bg-[#18BDD5] py-3 text-[#04121f] font-semibold hover:bg-[#15a8be]"
          >
            {changingStatus ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Enviar para Foto Pendente
          </Button>
          <Button
            onClick={() => handleStatusChange("finalizado")}
            disabled={changingStatus}
            variant="outline"
            className="flex-1 rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
          >
            {changingStatus ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Marcar como Finalizado
          </Button>
        </div>
      )}
    </div>
  );
}
