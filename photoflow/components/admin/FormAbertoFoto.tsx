"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadFotos } from "@/components/forms/UploadFotos";
import { PerguntaRenderer } from "@/components/forms/PerguntaRenderer";
import { Loader2, RefreshCw, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { PerguntaWithRelations } from "@/types";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

const inputClass =
  "h-11 rounded-xl bg-white/[0.05] border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-[#18BDD5]/40 focus-visible:border-[#18BDD5]/40 transition-shadow duration-200";

export function FormAbertoFoto({ initialTel }: { initialTel?: string }) {
  const router = useRouter();
  const [perguntas, setPerguntas] = useState<PerguntaWithRelations[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTel, setSearchTel] = useState("");
  const [searching, setSearching] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [reavaliando, setReavaliando] = useState(false);
  const [leadEncontrado, setLeadEncontrado] = useState<{ id: string; nome: string; telefone: string } | null>(null);
  const [leadJaTemFoto, setLeadJaTemFoto] = useState(false);
  const [respostasExistentes, setRespostasExistentes] = useState<Record<string, string>>({});

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    fetch("/api/perguntas?tipoPergunta=form_fechado")
      .then((res) => res.json())
      .then((data) => setPerguntas(data.filter((p: PerguntaWithRelations) => p.ativa)))
      .catch(() => {});
  }, []);

  // Auto-busca quando chega via redirect com tel na URL
  useEffect(() => {
    if (!initialTel) return;
    setSearchTel(initialTel);
    (async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/leads?search=${encodeURIComponent(initialTel)}&limit=1`);
        const data = await res.json();
        if (data.data?.length > 0) {
          const lead = data.data[0];
          setValue("nome", lead.nome);
          setValue("telefone", lead.telefone);
          setValue("email", lead.email || "");
          if (lead.status?.status === "novo") {
            const temFoto = Array.isArray(lead.fotos) && lead.fotos.length > 0;
            const existMap: Record<string, string> = {};
            for (const r of (lead.respostas || [])) {
              if (r.pergunta?.id && r.resposta?.id) {
                existMap[r.pergunta.id] = r.resposta.id;
              }
            }
            setRespostasExistentes(existMap);
            setRespostas(existMap);
            setLeadEncontrado({ id: lead.id, nome: lead.nome, telefone: lead.telefone });
            setLeadJaTemFoto(temFoto);
            setReavaliando(true);
            toast.success("Lead encontrado! Preencha as perguntas para reavaliar.");
          } else {
            setLeadId(lead.id);
            toast.success("Lead encontrado!");
          }
        } else {
          toast.info("Lead não encontrado.");
        }
      } catch {
        toast.error("Erro na busca");
      } finally {
        setSearching(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const searchLead = async () => {
    if (!searchTel) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(searchTel)}&limit=1`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const lead = data.data[0];
        setValue("nome", lead.nome);
        setValue("telefone", lead.telefone);
        setValue("email", lead.email || "");
        if (lead.status?.status === "novo") {
          const temFoto = Array.isArray(lead.fotos) && lead.fotos.length > 0;
          const existMap: Record<string, string> = {};
          for (const r of (lead.respostas || [])) {
            if (r.pergunta?.id && r.resposta?.id) {
              existMap[r.pergunta.id] = r.resposta.id;
            }
          }
          setRespostasExistentes(existMap);
          setRespostas(existMap);
          setLeadEncontrado({ id: lead.id, nome: lead.nome, telefone: lead.telefone });
          setLeadJaTemFoto(temFoto);
          setReavaliando(true);
          toast.success("Lead encontrado! Preencha as perguntas para reavaliar.");
        } else {
          setLeadId(lead.id);
          toast.success("Lead encontrado!");
        }
      } else {
        toast.info("Lead não encontrado. Crie um novo.");
      }
    } catch {
      toast.error("Erro na busca");
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const respostasArray = Object.entries(respostas).map(([perguntaId, respostaId]) => ({
        perguntaId,
        respostaId,
      }));

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          statusSlug: "em_atendimento",
          respostas: respostasArray,
        }),
      });

      if (!res.ok) throw new Error();
      const lead = await res.json();
      setLeadId(lead.id);
      setReavaliando(false);
      setLeadEncontrado(null);
      if (reavaliando && leadJaTemFoto) {
        setUploadDone(true);
        toast.success("Lead reavaliado com sucesso!");
      } else {
        toast.success(reavaliando ? "Lead reavaliado! Agora faça o upload das fotos." : "Lead criado! Agora faça o upload das fotos.");
      }
    } catch {
      toast.error("Erro ao criar lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewLead = () => {
    setLeadId(null);
    setUploadDone(false);
    setReavaliando(false);
    setLeadEncontrado(null);
    setLeadJaTemFoto(false);
    setRespostasExistentes({});
    reset();
    setRespostas({});
    setSearchTel("");
  };

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
          Buscar Lead Existente
        </p>
        <div className="flex gap-3">
          <Input
            placeholder="Buscar por telefone..."
            value={searchTel}
            onChange={(e) => setSearchTel(e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <Button
            onClick={searchLead}
            disabled={searching}
            className="bg-[#1599BD] hover:bg-[#014F85] text-white rounded-xl h-11 px-5 transition-colors duration-200"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </Button>
          <Button
            variant="outline"
            onClick={handleNewLead}
            className="border-white/15 text-slate-300 hover:bg-white/6 hover:text-white rounded-xl h-11 px-5 transition-colors duration-200"
          >
            <UserPlus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {!leadId ? (
        searching ? (
          /* Skeleton enquanto carrega dados do lead */
          <div className="space-y-5 animate-pulse">
            <div className="rounded-2xl border border-white/5 bg-white/3 h-18" />
            <div className="rounded-2xl border border-white/5 bg-white/3 px-5 py-5 space-y-6">
              <div className="h-2.5 w-28 bg-white/10 rounded-full" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2.5">
                  <div className="h-2.5 w-48 bg-white/10 rounded-full" />
                  <div className="h-10 w-full bg-white/6 rounded-xl" />
                  <div className="h-10 w-full bg-white/6 rounded-xl" />
                  <div className="h-10 w-full bg-white/6 rounded-xl" />
                </div>
              ))}
            </div>
            <div className="h-12 w-full bg-white/6 rounded-xl" />
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Banner de reavaliação */}
          {reavaliando && leadEncontrado && (
            <div className="rounded-2xl border border-[#18BDD5]/30 bg-[#18BDD5]/6 px-5 py-4 flex items-start gap-3">
              <div className="mt-0.5 w-8 h-8 shrink-0 rounded-full bg-[#18BDD5]/15 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-[#18BDD5]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{leadEncontrado.nome}</p>
                <p className="text-xs text-slate-400 mt-0.5">{leadEncontrado.telefone}</p>
                <p className="text-xs text-[#18BDD5] mt-1.5">
                  Lead com status <span className="font-semibold">Novo</span> — preencha as perguntas do Formulário Fechado para reavaliar e avançar no funil.
                </p>
              </div>
            </div>
          )}

          {/* Dados do Lead — apenas para leads novos */}
          {!reavaliando && (
            <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">
                Dados do Lead
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Nome *
                  </label>
                  <Input {...register("nome")} placeholder="Nome completo" className={inputClass} />
                  {errors.nome && <p className="text-xs text-red-400">{errors.nome.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Telefone *
                  </label>
                  <Input {...register("telefone")} placeholder="(11) 99999-9999" className={inputClass} />
                  {errors.telefone && <p className="text-xs text-red-400">{errors.telefone.message}</p>}
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email (opcional)
                  </label>
                  <Input type="email" {...register("email")} placeholder="email@exemplo.com" className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {/* Perguntas já respondidas — somente em modo reavaliação */}
          {reavaliando && perguntas.some((p) => respostasExistentes[p.id]) && (
            <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Já respondidas</p>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                  imutável
                </span>
              </div>
              <div className="space-y-5 opacity-60">
                {perguntas
                  .filter((p) => respostasExistentes[p.id])
                  .map((p) => (
                    <PerguntaRenderer
                      key={p.id}
                      pergunta={p}
                      value={respostasExistentes[p.id]}
                      onChange={() => {}}
                      variant="admin"
                      readOnly
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Perguntas pendentes — editáveis */}
          {perguntas.filter((p) => !reavaliando || !respostasExistentes[p.id]).length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">
                {reavaliando ? "Perguntas pendentes" : "Perguntas"}
              </p>
              <div className="space-y-5">
                {perguntas
                  .filter((p) => !reavaliando || !respostasExistentes[p.id])
                  .map((p) => (
                    <PerguntaRenderer
                      key={p.id}
                      pergunta={p}
                      value={respostas[p.id] || ""}
                      onChange={(val) => setRespostas((prev) => ({ ...prev, [p.id]: val }))}
                      variant="admin"
                    />
                  ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl font-medium bg-[#1599BD] hover:bg-[#014F85] text-white transition-colors duration-200 shadow-[0_4px_20px_rgba(21,153,189,0.2)]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : reavaliando ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {reavaliando ? "Reavaliar Lead" : "Criar Lead e Continuar"}
          </Button>
        </form>
        )
      ) : uploadDone ? (
        <div className="rounded-2xl border border-[#18BDD5]/30 bg-[#07192a]/60 backdrop-blur-sm px-5 py-10 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-[#18BDD5]/15 flex items-center justify-center">
            <svg className="w-7 h-7 text-[#18BDD5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-lg">
              {leadJaTemFoto ? "Lead reavaliado!" : "Fotos enviadas!"}
            </p>
            <p className="text-slate-400 text-sm mt-1">
              {leadJaTemFoto
                ? "Pontuação e status atualizados. Lead avançou para Em Atendimento."
                : "O atendimento foi registrado com sucesso."}
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleNewLead}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1599BD] hover:bg-[#014F85] text-white text-sm font-medium px-5 h-11 transition-colors duration-200"
            >
              <UserPlus className="h-4 w-4" />
              Novo Lead
            </button>
            <button
              onClick={() => router.push("/admin/leads")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 text-slate-300 hover:bg-white/5 hover:text-white text-sm font-medium px-5 h-11 transition-colors duration-200"
            >
              Ver Leads
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">
            Upload de Fotos
          </p>
          <UploadFotos
            leadId={leadId}
            onUploadComplete={() => {
              setUploadDone(true);
              toast.success("Fotos enviadas com sucesso!");
            }}
          />
        </div>
      )}
    </div>
  );
}
