"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  const base =
    "inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-xl border text-sm font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none";
  const inactive =
    "bg-white/4 border-white/10 text-white/70 hover:bg-white/8 hover:text-white";
  const active =
    "bg-[#18BDD5] border-[#18BDD5] text-[#04121f] hover:bg-[#1599BD]";

  return (
    <div className="flex items-center gap-1">
      <button
        className={`${base} ${inactive}`}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`${base} ${p === page ? active : inactive}`}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}
      <button
        className={`${base} ${inactive}`}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Próxima página"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
