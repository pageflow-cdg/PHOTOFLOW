"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Pagination } from "@/components/shared/Pagination";
import { Filters } from "@/components/shared/Filters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import { Eye, LayoutGrid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Lead {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  status: { id: string; status: string };
  fotos: { id: string; fotoUrl: string; status: { status: string } }[];
  respostas: { pergunta: { descricao: string }; resposta: { resposta: string } }[];
  historico: { status: { status: string }; createdAt: string }[];
  createdAt: string;
}

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

  useEffect(() => {
    // Fetch statuses for filter
    fetch("/api/leads?limit=0")
      .then(() => {
        // Just use hardcoded statuses for now
        setStatuses([
          { id: "1", status: "novo" },
          { id: "2", status: "em_atendimento" },
          { id: "3", status: "foto_pendente" },
          { id: "4", status: "foto_entregue" },
          { id: "5", status: "finalizado" },
        ]);
      })
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2 ml-4">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : viewMode === "table" ? (
        <div className="rounded-lg border bg-white dark:bg-zinc-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Fotos</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.nome}</TableCell>
                  <TableCell>{lead.telefone}</TableCell>
                  <TableCell>
                    <StatusBadge status={lead.status.status} />
                  </TableCell>
                  <TableCell>
                    {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{lead.fotos.length}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {leads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => (
            <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedLead(lead)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{lead.nome}</h3>
                  <StatusBadge status={lead.status.status} />
                </div>
                <p className="text-sm text-zinc-500">{lead.telefone}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-zinc-400">
                  <span>{new Date(lead.createdAt).toLocaleDateString("pt-BR")}</span>
                  <span>{lead.fotos.length} foto(s)</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 por página</SelectItem>
            <SelectItem value="25">25 por página</SelectItem>
            <SelectItem value="50">50 por página</SelectItem>
          </SelectContent>
        </Select>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {selectedLead && (
        <LeadDetailDrawer
          lead={selectedLead}
          open={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          statuses={statuses}
        />
      )}
    </div>
  );
}
