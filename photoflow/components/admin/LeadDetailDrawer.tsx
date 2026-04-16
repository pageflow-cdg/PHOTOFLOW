"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

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

interface LeadDetailDrawerProps {
  lead: Lead;
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
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lead.nome}</DialogTitle>
          <DialogDescription>Detalhes do lead</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="respostas">Respostas</TabsTrigger>
            <TabsTrigger value="fotos">Fotos</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-zinc-500">Nome</p>
                <p className="font-medium">{lead.nome}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Telefone</p>
                <p className="font-medium">{lead.telefone}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Email</p>
                <p className="font-medium">{lead.email || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Data</p>
                <p className="font-medium">
                  {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-2">Status</p>
              <div className="flex items-center gap-3">
                <StatusBadge status={lead.status.status} />
                <Select
                  value={lead.status.id}
                  onValueChange={(val) => onStatusChange(lead.id, val)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Alterar status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="respostas" className="mt-4">
            {lead.respostas.length > 0 ? (
              <div className="space-y-3">
                {lead.respostas.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <p className="text-sm text-zinc-500">{r.pergunta.descricao}</p>
                    <p className="font-medium mt-1">{r.resposta?.resposta ?? r.respostaTexto ?? "—"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8">Nenhuma resposta registrada</p>
            )}
          </TabsContent>

          <TabsContent value="fotos" className="mt-4">
            {lead.fotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {lead.fotos.map((foto) => (
                  <div key={foto.id} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={foto.fotoUrl}
                      alt="Foto"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute bottom-1 left-1">
                      <StatusBadge status={foto.status.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8">Nenhuma foto enviada</p>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {lead.historico.length > 0 ? (
              <div className="space-y-3">
                {lead.historico.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900">
                    <StatusBadge status={h.status.status} />
                    <span className="text-sm text-zinc-500">
                      {new Date(h.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-8">Nenhum histórico</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
