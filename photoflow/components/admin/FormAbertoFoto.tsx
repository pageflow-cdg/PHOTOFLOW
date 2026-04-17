"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="space-y-6">
      {/* Search bar */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Lead Existente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Buscar por telefone..."
              value={searchTel}
              onChange={(e) => setSearchTel(e.target.value)}
              className="flex-1"
            />
            <Button onClick={searchLead} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </Button>
            <Button variant="outline" onClick={handleNewLead}>
              <UserPlus className="h-4 w-4" />
              Novo Lead
            </Button>
          </div>
        </CardContent>
      </Card>

      {!leadId ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input {...register("nome")} placeholder="Nome completo" />
                  {errors.nome && <p className="text-sm text-red-500">{errors.nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Telefone *</Label>
                  <Input {...register("telefone")} placeholder="(11) 99999-9999" />
                  {errors.telefone && <p className="text-sm text-red-500">{errors.telefone.message}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Email (opcional)</Label>
                  <Input type="email" {...register("email")} placeholder="email@exemplo.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          {perguntas.length > 0 && (
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

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Criar Lead e Continuar
          </Button>
        </form>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Fotos</CardTitle>
          </CardHeader>
          <CardContent>
            <UploadFotos
              leadId={leadId}
              onUploadComplete={() => {
                toast.success("Fotos enviadas com sucesso!");
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
