"use client";

import type { PerguntaWithRelations } from "@/types";

interface PerguntaRendererProps {
  pergunta: PerguntaWithRelations;
  value: string;
  onChange: (value: string) => void;
  variant?: "admin" | "public";
}

export function PerguntaRenderer({ pergunta, value, onChange, variant = "admin" }: PerguntaRendererProps) {
  const isPublic = variant === "public";

  return (
    <div className="space-y-3">
      <p className={
        isPublic
          ? "text-sm font-semibold text-[#0B284F]"
          : "text-sm font-medium text-slate-300"
      }>
        {pergunta.descricao}
      </p>
      <div className="flex flex-col gap-2">
        {pergunta.respostas.map((r) => {
          const isSelected = value === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                isPublic
                  ? isSelected
                    ? "bg-gradient-to-r from-[#1599BD] to-[#18BDD5] text-white border-transparent shadow-[0_4px_16px_rgba(21,153,189,0.3)]"
                    : "bg-white/60 text-[#0B284F] border-[#E6E7E9] hover:border-[#1599BD]/40 hover:bg-white/80"
                  : isSelected
                    ? "bg-[#18BDD5]/12 text-[#18BDD5] border-[#18BDD5]/30 shadow-[0_0_12px_rgba(24,189,213,0.08)]"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
              }`}
            >
              {r.resposta}
            </button>
          );
        })}
      </div>
    </div>
  );
}
