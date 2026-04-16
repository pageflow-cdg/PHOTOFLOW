"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statuses: { id: string; status: string }[];
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onClear: () => void;
}

export function Filters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statuses,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-50">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#18BDD5]/60" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-white/4 border-white/10 text-white placeholder:text-white/35 rounded-xl focus-visible:border-[#18BDD5]/60 focus-visible:ring-0"
          />
        </div>
      </div>
      <div className="w-45">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="bg-white/4 border-white/10 text-white rounded-xl focus:ring-0 [&>svg]:text-white/50">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent className="bg-[#07192a] border-white/10 text-white">
            <SelectItem value="all" className="focus:bg-white/8 focus:text-white">Todos</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id} value={s.status} className="focus:bg-white/8 focus:text-white">
                {s.status.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-37.5 bg-white/4 border-white/10 text-white rounded-xl focus-visible:border-[#18BDD5]/60 focus-visible:ring-0 scheme-dark"
        />
      </div>
      <div>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-37.5 bg-white/4 border-white/10 text-white rounded-xl focus-visible:border-[#18BDD5]/60 focus-visible:ring-0 scheme-dark"
        />
      </div>
      <button
        onClick={onClear}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/60 hover:bg-white/8 hover:text-white transition-colors"
        aria-label="Limpar filtros"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
