"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  user: string;
  role: { role: string };
}

interface SendToCloserModalProps {
  leadId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (closerId: string) => void;
}

export function SendToCloserModal({
  leadId,
  open,
  onClose,
  onSuccess,
}: SendToCloserModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [responsavelId, setResponsavelId] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/usuarios")
        .then((res) => res.json())
        .then((data: User[]) => setUsers(data))
        .catch(() => toast.error("Erro ao buscar usuários"));

      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      setResponsavelId("");
    }
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async () => {
    if (!responsavelId) {
      toast.error("Selecione um responsável");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/closer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, responsavelId }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Lead enviado para o Closer");
        onSuccess(data.id);
        handleClose();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao enviar para closer");
      }
    } catch {
      toast.error("Erro ao enviar para closer");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a1929] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15">
              <UserCheck className="h-5 w-5 text-violet-400" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">
                Enviar para Closer
              </h3>
              <p className="text-sm text-white/45">
                Selecione o responsável pelo atendimento
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">
                Responsável (Closer)
              </label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger className="w-full bg-white/4 border-white/10 text-white rounded-xl focus:ring-0 [&>svg]:text-white/50">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="bg-[#07192a] border-white/10 text-white">
                  {users.map((u) => (
                    <SelectItem
                      key={u.id}
                      value={u.id}
                      className="focus:bg-white/8 focus:text-white"
                    >
                      {u.user}{" "}
                      <span className="text-white/40">({u.role.role})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !responsavelId}
                className="flex-1 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
