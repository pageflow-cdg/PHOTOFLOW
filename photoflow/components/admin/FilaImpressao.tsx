"use client";

import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Foto {
  id: string;
  fotoUrl: string;
  status: { id: string; status: string };
  lead: { id: string; nome: string; telefone: string };
  createdAt: string;
}

export function FilaImpressao() {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("pronta");

  const fetchFotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fotos?status=${filter}`);
      const data = await res.json();
      setFotos(data);
    } catch {
      toast.error("Erro ao buscar fotos");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchFotos();
  }, [fetchFotos]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === fotos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(fotos.map((f) => f.id)));
    }
  };

  const handlePrint = async () => {
    const selectedFotos = fotos.filter((f) => selected.has(f.id));
    if (selectedFotos.length === 0) {
      toast.error("Selecione pelo menos uma foto");
      return;
    }

    // Open print window
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Habilite popups para imprimir");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Impressão PhotoFlow</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px; }
              .photo-item { page-break-inside: avoid; }
              .photo-item img { width: 100%; height: auto; }
              .photo-info { font-size: 10px; text-align: center; margin-top: 4px; }
            }
            body { font-family: sans-serif; }
            .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 8px; }
            .photo-item img { width: 100%; height: auto; }
            .photo-info { font-size: 12px; text-align: center; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="photo-grid">
            ${selectedFotos
              .map(
                (f) => `
              <div class="photo-item">
                <img src="${f.fotoUrl}" alt="Foto" />
                <div class="photo-info">${f.lead.nome}</div>
              </div>
            `
              )
              .join("")}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Update status to "impressa"
    for (const fotoId of selected) {
      try {
        const foto = fotos.find((f) => f.id === fotoId);
        if (foto) {
          await fetch(`/api/fotos/${fotoId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ statusId: foto.status.id }),
          });
        }
      } catch {
        // ignore individual errors
      }
    }

    toast.success(`${selected.size} foto(s) enviadas para impressão`);
    setSelected(new Set());
    fetchFotos();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pronta">Prontas</SelectItem>
              <SelectItem value="impressa">Impressas</SelectItem>
              <SelectItem value="entregue">Entregues</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={selectAll}>
            {selected.size === fotos.length ? "Desmarcar todas" : "Selecionar todas"}
          </Button>
        </div>
        <Button onClick={handlePrint} disabled={selected.size === 0}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir ({selected.size})
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma foto na fila</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                selected.has(foto.id)
                  ? "border-zinc-900 dark:border-white"
                  : "border-transparent hover:border-zinc-300"
              }`}
              onClick={() => toggleSelect(foto.id)}
            >
              <Image
                src={foto.fotoUrl}
                alt={`Foto de ${foto.lead.nome}`}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selected.has(foto.id)}
                  onCheckedChange={() => toggleSelect(foto.id)}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-xs text-white truncate">{foto.lead.nome}</p>
                <StatusBadge status={foto.status.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
