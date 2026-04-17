"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UploadFotos } from "./UploadFotos";
import { PerguntaRenderer } from "./PerguntaRenderer";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { PerguntaWithRelations } from "@/types";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

const glassCard =
  "rounded-2xl px-6 py-7 public-form-card";

const glassStyle = {
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
  border: "1px solid rgba(255,255,255,0.6)",
} as const;

const inputClass =
  "h-11 rounded-xl bg-white border-[#E6E7E9] focus-visible:ring-1 focus-visible:ring-[#1599BD] focus-visible:border-[#1599BD] placeholder:text-[#BDBFC7] text-[#0B284F] transition-shadow duration-200";

export function FormularioCompleto() {
  const [perguntas, setPerguntas] = useState<PerguntaWithRelations[]>([]);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    fetch("/api/perguntas?tipoPergunta=form_aberto")
      .then((res) => res.json())
      .then((data) => {
        setPerguntas(data.filter((p: PerguntaWithRelations) => p.ativa));
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar perguntas");
        setLoading(false);
      });
  }, []);

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
          respostas: respostasArray,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const lead = await res.json();
      setLeadId(lead.id);
      toast.success("Dados salvos! Agora envie suas fotos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <div className={glassCard} style={glassStyle}>
          <CheckCircle className="h-14 w-14 text-[#18BDD5] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#0B284F] mb-2">Tudo certo!</h2>
          <p className="text-sm text-[#0B284F]/60">
            Suas fotos serão entregues em breve!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
      <div className="text-center mb-2">
        <p className="text-sm text-white/60">Preencha seus dados para receber suas fotos</p>
      </div>

      {!leadId ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Dados pessoais */}
          <div className={glassCard} style={glassStyle}>
            <p className="text-xs font-medium uppercase tracking-wide text-[#0B284F]/50 mb-5">
              Seus dados
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[#0B284F]">
                  Nome *
                </label>
                <Input id="nome" {...register("nome")} placeholder="Seu nome completo" className={inputClass} />
                {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[#0B284F]">
                  Telefone *
                </label>
                <Input id="telefone" {...register("telefone")} placeholder="(11) 99999-9999" className={inputClass} />
                {errors.telefone && <p className="text-xs text-red-500 mt-1">{errors.telefone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-[#0B284F]">
                  Email (opcional)
                </label>
                <Input id="email" type="email" {...register("email")} placeholder="seu@email.com" className={inputClass} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          {/* Perguntas */}
          {!loading && perguntas.length > 0 && (
            <div className={glassCard} style={glassStyle}>
              <p className="text-xs font-medium uppercase tracking-wide text-[#0B284F]/50 mb-5">
                Perguntas
              </p>
              <div className="space-y-5">
                {perguntas.map((p) => (
                  <PerguntaRenderer
                    key={p.id}
                    pergunta={p}
                    value={respostas[p.id] || ""}
                    onChange={(val) => setRespostas((prev) => ({ ...prev, [p.id]: val }))}
                    variant="public"
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl font-medium bg-[#1599BD] hover:bg-[#014F85] text-white border-0 shadow-[0_4px_20px_rgba(21,153,189,0.3)] transition-colors duration-200 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Continuar para fotos"
            )}
          </Button>
        </form>
      ) : (
        <div className={glassCard} style={glassStyle}>
          <p className="text-xs font-medium uppercase tracking-wide text-[#0B284F]/50 mb-5">
            Envie suas fotos
          </p>
          <UploadFotos
            leadId={leadId}
            onUploadComplete={() => setSuccess(true)}
          />
        </div>
      )}
    </div>
  );
}
