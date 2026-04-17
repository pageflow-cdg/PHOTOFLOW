"use client";

import { Label } from "@/components/ui/label";
import type { PerguntaWithRelations } from "@/types";

interface PerguntaRendererProps {
  pergunta: PerguntaWithRelations;
  value: string;
  onChange: (value: string) => void;
}

export function PerguntaRenderer({ pergunta, value, onChange }: PerguntaRendererProps) {
  return (
    <div className="space-y-2">
      <Label>{pergunta.descricao}</Label>
      <div className="flex flex-col gap-2">
        {pergunta.respostas.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onChange(r.id)}
            className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium border transition-colors ${
              value === r.id
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                : "bg-transparent text-zinc-700 border-zinc-200 hover:border-zinc-400 dark:text-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-500"
            }`}
          >
            {r.resposta}
          </button>
        ))}
      </div>
    </div>
  );
}
