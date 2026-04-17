"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import { Filters } from "@/components/shared/Filters";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { Eye, LayoutGrid, List, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  status: { id: string; status: string };
  fotos: { id: string; fotoUrl: string; status: { status: string } }[];
  respostas: { pergunta: { descricao: string }; resposta: { resposta: string } | null; respostaTexto?: string | null }[];
  historico: { status: { status: string }; createdAt: string }[];
  createdAt: string;
}

const MOBILE_PAGE_SIZE = 10;

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statuses, setStatuses] = useState<{ id: string; status: string }[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Mobile infinite scroll
  const [mobileLeads, setMobileLeads] = useState<Lead[]>([]);
  const [mobilePage, setMobilePage] = useState(1);
  const [mobileHasMore, setMobileHasMore] = useState(true);
  const [mobileLoading, setMobileLoading] = useState(true);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.data);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Erro ao buscar leads");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Mobile fetch — replace=true on filter change/reset, replace=false for load-more
  const fetchMobileLeads = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setMobileLoading(true);
    else setMobileLoadingMore(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(MOBILE_PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (status && status !== "all") params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      if (replace) {
        setMobileLeads(data.data);
      } else {
        setMobileLeads((prev) => [...prev, ...data.data]);
      }
      setMobileHasMore(pageNum < data.totalPages);
    } catch {
      toast.error("Erro ao buscar leads");
    } finally {
      if (replace) setMobileLoading(false);
      else setMobileLoadingMore(false);
    }
  }, [search, status, dateFrom, dateTo]);

  // Reload mobile when filters change (fetchMobileLeads is recreated when deps change)
  useEffect(() => {
    setMobilePage(1);
    setMobileHasMore(true);
    fetchMobileLeads(1, true);
  }, [fetchMobileLeads]);

  // IntersectionObserver — trigger next page when sentinel enters viewport
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && mobileHasMore && !mobileLoadingMore && !mobileLoading) {
          const next = mobilePage + 1;
          setMobilePage(next);
          fetchMobileLeads(next, false);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [mobileHasMore, mobileLoadingMore, mobileLoading, mobilePage, fetchMobileLeads]);

  useEffect(() => {
    fetch("/api/leads/statuses")
      .then((res) => res.json())
      .then((data: { id: string; status: string }[]) => setStatuses(data))
      .catch(() => {});
  }, []);

  const handleStatusChange = async (leadId: string, statusId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId }),
      });
      if (res.ok) {
        toast.success("Status atualizado");
        fetchLeads();
        setMobilePage(1);
        fetchMobileLeads(1, true);
        const detailRes = await fetch(`/api/leads/${leadId}`);
        if (detailRes.ok) {
          const updatedLead = await detailRes.json();
          setSelectedLead(updatedLead);
        }
      } else {
        toast.error("Erro ao atualizar status");
      }
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const toggleBase = "inline-flex items-center justify-center h-9 w-9 rounded-xl border border-white/10 transition-colors";
  const toggleActive = "bg-[#18BDD5] text-[#04121f] border-[#18BDD5]";
  const toggleInactive = "bg-white/4 text-white/60 hover:bg-white/8 hover:text-white";

  return (
    <div className="space-y-4">
      {/* Filters + view toggle */}
      <div className="flex items-center gap-4">
        <Filters
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          status={status}
          onStatusChange={(v) => { setStatus(v); setPage(1); }}
          statuses={statuses}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onClear={clearFilters}
        />
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <button
            className={`${toggleBase} ${viewMode === "table" ? toggleActive : toggleInactive}`}
            onClick={() => setViewMode("table")}
            aria-label="Visualização em tabela"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            className={`${toggleBase} ${viewMode === "grid" ? toggleActive : toggleInactive}`}
            onClick={() => setViewMode("grid")}
            aria-label="Visualização em grade"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Desktop content */}
      {loading ? (
        <div className="hidden md:block space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 w-full rounded-xl bg-white/6 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Tabela — apenas desktop, quando viewMode === "table" */}
          {viewMode === "table" && (
            <div className="hidden md:block rounded-3xl border border-white/10 bg-[#07192a]/85 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/8 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-widest text-[#18BDD5]/70 font-semibold">Nome</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest text-[#18BDD5]/70 font-semibold">Telefone</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest text-[#18BDD5]/70 font-semibold">Status</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest text-[#18BDD5]/70 font-semibold">Data</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest text-[#18BDD5]/70 font-semibold">Fotos</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest text-[#18BDD5]/70 font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="border-b border-white/6 hover:bg-white/4 transition-colors">
                      <TableCell className="font-medium text-white">{lead.nome}</TableCell>
                      <TableCell className="text-white/60">{lead.telefone}</TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status.status} />
                      </TableCell>
                      <TableCell className="text-white/60">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-white/60">{lead.fotos.length}</TableCell>
                      <TableCell>
                        <button
                          className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-white/10 bg-white/4 text-[#18BDD5]/70 hover:text-[#18BDD5] hover:bg-white/8 transition-colors"
                          onClick={() => setSelectedLead(lead)}
                          aria-label={`Ver detalhes de ${lead.nome}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leads.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-white/40">
                        Nenhum lead encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Desktop grid — quando viewMode === "grid" */}
          {viewMode === "grid" && (
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  className="text-left bg-white/4 border border-white/8 rounded-2xl p-4 hover:bg-white/7 hover:border-[#18BDD5]/30 transition-all cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-white text-sm leading-snug">{lead.nome}</h3>
                    <StatusBadge status={lead.status.status} />
                  </div>
                  <p className="text-sm text-white/55">{lead.telefone}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-white/40">
                    <span>{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span>{lead.fotos.length} foto(s)</span>
                  </div>
                </button>
              ))}
              {leads.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/40">
                  Nenhum lead encontrado
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile — infinite scroll */}
      <div className="block md:hidden">
        {mobileLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 w-full rounded-2xl bg-white/6 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3">
              {mobileLeads.map((lead) => (
                <button
                  key={lead.id}
                  className="text-left bg-white/4 border border-white/8 rounded-2xl p-4 hover:bg-white/7 hover:border-[#18BDD5]/30 transition-all cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="font-semibold text-white text-sm leading-snug">{lead.nome}</h3>
                    <StatusBadge status={lead.status.status} />
                  </div>
                  <p className="text-sm text-white/55">{lead.telefone}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-white/40">
                    <span>{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</span>
                    <span>{lead.fotos.length} foto(s)</span>
                  </div>
                </button>
              ))}
              {mobileLeads.length === 0 && (
                <div className="text-center py-12 text-white/40">
                  Nenhum lead encontrado
                </div>
              )}
            </div>
            {/* Sentinel — entra na viewport para disparar a próxima página */}
            <div ref={sentinelRef} className="h-4" />
            {mobileLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#18BDD5]/70" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer — desktop only */}
      <div className="hidden md:flex items-center justify-between border-t border-white/8 pt-3">
        <Select
          value={String(limit)}
          onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}
        >
          <SelectTrigger className="w-35 bg-white/4 border-white/10 text-white/70 rounded-xl focus:ring-0 [&>svg]:text-white/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#07192a] border-white/10 text-white">
            <SelectItem value="10" className="focus:bg-white/8 focus:text-white">10 por página</SelectItem>
            <SelectItem value="25" className="focus:bg-white/8 focus:text-white">25 por página</SelectItem>
            <SelectItem value="50" className="focus:bg-white/8 focus:text-white">50 por página</SelectItem>
          </SelectContent>
        </Select>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <LeadDetailDrawer
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={handleStatusChange}
        statuses={statuses}
      />
    </div>
  );
}
