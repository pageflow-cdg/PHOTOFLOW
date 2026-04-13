"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PerguntaWithRelations } from "@/types";

interface PerguntaRendererProps {
  pergunta: PerguntaWithRelations;
  value: string;
  onChange: (value: string) => void;
}

export function PerguntaRenderer({ pergunta, value, onChange }: PerguntaRendererProps) {
  const tipo = pergunta.tipo.descricao;

  if (tipo === "texto") {
    return (
      <div className="space-y-2">
        <Label>{pergunta.descricao}</Label>
        <Textarea
          placeholder="Digite sua resposta..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (tipo === "multipla_escolha") {
    return (
      <div className="space-y-2">
        <Label>{pergunta.descricao}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma opção" />
          </SelectTrigger>
          <SelectContent>
            {pergunta.respostas.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.resposta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (tipo === "escala") {
    return (
      <div className="space-y-2">
        <Label>{pergunta.descricao}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                const resposta = pergunta.respostas.find(
                  (r) => r.resposta === String(n)
                );
                if (resposta) onChange(resposta.id);
              }}
              className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                pergunta.respostas.find((r) => r.id === value)?.resposta === String(n)
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tipo === "sim_nao") {
    return (
      <div className="space-y-2">
        <Label>{pergunta.descricao}</Label>
        <div className="flex gap-3">
          {pergunta.respostas.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                value === r.id
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {r.resposta}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
