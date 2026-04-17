"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadFotos } from "@/components/forms/UploadFotos";
import { PerguntaRenderer } from "@/components/forms/PerguntaRenderer";
import { Loader2, Search, UserPlus } from "lucide-react";
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

export function FormAbertoFoto() {
  const [perguntas, setPerguntas] = useState<PerguntaWithRelations[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [leadId, setLeadId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTel, setSearchTel] = useState("");
  const [searching, setSearching] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    fetch("/api/perguntas?tipoPergunta=form_fechado")
      .then((res) => res.json())
      .then((data) => setPerguntas(data.filter((p: PerguntaWithRelations) => p.ativa)))
      .catch(() => {});
  }, []);

  const searchLead = async () => {
    if (!searchTel) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(searchTel)}&limit=1`);
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const lead = data.data[0];
        setLeadId(lead.id);
        setValue("nome", lead.nome);
        setValue("telefone", lead.telefone);
        setValue("email", lead.email || "");
        toast.success("Lead encontrado!");
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
      toast.success("Lead criado! Agora faça o upload das fotos.");
    } catch {
      toast.error("Erro ao criar lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewLead = () => {
    setLeadId(null);
    reset();
    setRespostas({});
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
            className="border-white/15 text-slate-300 hover:bg-white/[0.06] hover:text-white rounded-xl h-11 px-5 transition-colors duration-200"
          >
            <UserPlus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {!leadId ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Dados do Lead */}
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

          {/* Perguntas */}
          {perguntas.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">
                Perguntas
              </p>
              <div className="space-y-5">
                {perguntas.map((p) => (
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
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar Lead e Continuar
          </Button>
        </form>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">
            Upload de Fotos
          </p>
          <UploadFotos
            leadId={leadId}
            onUploadComplete={() => {
              toast.success("Fotos enviadas com sucesso!");
            }}
          />
        </div>
      )}
    </div>
  );
}
