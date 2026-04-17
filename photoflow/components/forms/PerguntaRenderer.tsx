"use client";

import type { PerguntaWithRelations } from "@/types";

interface PerguntaRendererProps {
  pergunta: PerguntaWithRelations;
  value: string;
  onChange: (value: string) => void;
  variant?: "admin" | "public";
  readOnly?: boolean;
}

export function PerguntaRenderer({ pergunta, value, onChange, variant = "admin", readOnly = false }: PerguntaRendererProps) {
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
          if (readOnly) {
            return (
              <div
                key={r.id}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between ${
                  isSelected
                    ? "bg-emerald-500/8 text-emerald-300 border-emerald-500/20"
                    : "bg-white/1.5 text-slate-600 border-white/5"
                }`}
              >
                <span>{r.resposta}</span>
                {isSelected && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 shrink-0 ml-3">
                    respondido
                  </span>
                )}
              </div>
            );
          }
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(r.id)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-200 ${
                isPublic
                  ? isSelected
                    ? "bg-linear-to-r from-[#1599BD] to-[#18BDD5] text-white border-transparent shadow-[0_4px_16px_rgba(21,153,189,0.3)]"
                    : "bg-white/60 text-[#0B284F] border-[#E6E7E9] hover:border-[#1599BD]/40 hover:bg-white/80"
                  : isSelected
                    ? "bg-[#18BDD5]/12 text-[#18BDD5] border-[#18BDD5]/30 shadow-[0_0_12px_rgba(24,189,213,0.08)]"
                    : "bg-white/3 text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/6"
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
