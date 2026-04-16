"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { X } from "lucide-react";

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

interface LeadDetailDrawerProps {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (leadId: string, statusId: string) => void;
  statuses: { id: string; status: string }[];
}

export function LeadDetailDrawer({
  lead,
  open,
  onClose,
  onStatusChange,
  statuses,
}: LeadDetailDrawerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      // Two rAFs ensure the browser paints the off-screen state first
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      const id = requestAnimationFrame(() => setVisible(false));
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-[#050d18] transition-transform duration-300 ease-out
          md:inset-y-0 md:right-0 md:left-auto md:w-160 md:border-l md:border-white/10
          ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        {lead && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 px-6 py-5 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">{lead.nome}</h2>
                <p className="mt-0.5 text-sm text-white/45">Detalhes do lead</p>
              </div>
              <button
                onClick={handleClose}
                className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/4 text-white/50 hover:text-white hover:bg-white/8 transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="dados" className="w-full">
                {/* Sticky tabs bar */}
                <div className="sticky top-0 z-10 bg-[#050d18] border-b border-white/8 px-6 py-3">
                  <TabsList className="grid w-full grid-cols-4 bg-white/6 rounded-2xl p-1 h-auto gap-1">
                    {(["dados", "respostas", "fotos", "historico"] as const).map((tab) => (
                      <TabsTrigger
                        key={tab}
                        value={tab}
                        className="rounded-xl py-1.5 text-sm capitalize text-white/50 transition-all data-[state=active]:bg-[#18BDD5] data-[state=active]:text-[#04121f] data-[state=active]:shadow-sm"
                      >
                        {tab === "historico" ? "Histórico" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <div className="px-6 py-5">
                  {/* Aba: Dados */}
                  <TabsContent value="dados" className="mt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Nome", value: lead.nome },
                        { label: "Telefone", value: lead.telefone },
                        { label: "Email", value: lead.email || "—" },
                        { label: "Data de cadastro", value: new Date(lead.createdAt).toLocaleDateString("pt-BR") },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">{label}</p>
                          <p className="mt-1 font-medium text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70 mb-3">Status</p>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={lead.status.status} />
                        <Select
                          value={lead.status.id}
                          onValueChange={(val) => onStatusChange(lead.id, val)}
                        >
                          <SelectTrigger className="w-50 bg-white/4 border-white/10 text-white rounded-xl focus:ring-0 [&>svg]:text-white/50">
                            <SelectValue placeholder="Alterar status" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#07192a] border-white/10 text-white">
                            {statuses.map((s) => (
                              <SelectItem key={s.id} value={s.id} className="focus:bg-white/8 focus:text-white">
                                {s.status.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba: Respostas */}
                  <TabsContent value="respostas" className="mt-0">
                    {lead.respostas.length > 0 ? (
                      <div className="space-y-3">
                        {lead.respostas.map((r, i) => (
                          <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                            <p className="text-sm text-white/60">{r.pergunta.descricao}</p>
                            <p className="mt-1 font-medium text-white">
                              {r.resposta?.resposta ?? r.respostaTexto ?? "—"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-12 text-center text-white/40">Nenhuma resposta registrada</p>
                    )}
                  </TabsContent>

                  {/* Aba: Fotos */}
                  <TabsContent value="fotos" className="mt-0">
                    {lead.fotos.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {lead.fotos.map((foto) => (
                          <div key={foto.id} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-white/4">
                            <Image
                              src={foto.fotoUrl}
                              alt="Foto do lead"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <div className="absolute bottom-1.5 left-1.5">
                              <StatusBadge status={foto.status.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-12 text-center text-white/40">Nenhuma foto enviada</p>
                    )}
                  </TabsContent>

                  {/* Aba: Histórico */}
                  <TabsContent value="historico" className="mt-0">
                    {lead.historico.length > 0 ? (
                      <div className="divide-y divide-white/6">
                        {lead.historico.map((h, i) => (
                          <div key={i} className="flex items-center justify-between py-3">
                            <StatusBadge status={h.status.status} />
                            <span className="text-xs text-white/40">
                              {new Date(h.createdAt).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="py-12 text-center text-white/40">Nenhum histórico</p>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </>
  );
}
