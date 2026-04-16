"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadFotos } from "./UploadFotos";
import { PerguntaRenderer } from "./PerguntaRenderer";
import { Loader2, Camera, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { PerguntaWithRelations } from "@/types";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

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
    fetch("/api/perguntas")
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
      const respostasArray = Object.entries(respostas).map(([perguntaId, value]) => {
        const pergunta = perguntas.find((p) => p.id === perguntaId);
        const isTexto = pergunta?.tipo.descricao === "texto";
        return {
          perguntaId,
          respostaId: isTexto ? undefined : value,
          respostaTexto: isTexto ? value : undefined,
        };
      });

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Tudo certo!</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Suas fotos serão entregues em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <Camera className="h-12 w-12 mx-auto text-zinc-900 dark:text-white mb-3" />
        <h1 className="text-2xl font-bold">PhotoFlow</h1>
        <p className="text-zinc-500 mt-1">Preencha seus dados para receber suas fotos</p>
      </div>

      {!leadId ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" {...register("nome")} placeholder="Seu nome completo" />
                {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input id="telefone" {...register("telefone")} placeholder="(11) 99999-9999" />
                {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (opcional)</Label>
                <Input id="email" type="email" {...register("email")} placeholder="seu@email.com" />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
            </CardContent>
          </Card>

          {!loading && perguntas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Perguntas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {perguntas.map((p) => (
                  <PerguntaRenderer
                    key={p.id}
                    pergunta={p}
                    value={respostas[p.id] || ""}
                    onChange={(val) => setRespostas((prev) => ({ ...prev, [p.id]: val }))}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={submitting} className="w-full h-12 text-base">
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
        <Card>
          <CardHeader>
            <CardTitle>Envie suas fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadFotos
              leadId={leadId}
              onUploadComplete={() => setSuccess(true)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
