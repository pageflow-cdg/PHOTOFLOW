"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PerguntaWithRelations } from "@/types";

interface UserData {
  id: string;
  user: string;
  role: { id: string; role: string };
  createdAt: string;
}

const inputClass =
  "bg-white/[0.05] border border-white/10 text-white rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1599BD]/40 focus:border-[#1599BD]/50 placeholder:text-slate-600 w-full transition-colors duration-200";

export function PerguntasCRUD() {
  const [perguntas, setPerguntas] = useState<PerguntaWithRelations[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<{ id: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // New pergunta form
  const [newDesc, setNewDesc] = useState("");
  const [newTipoPergunta, setNewTipoPergunta] = useState("ambos");
  const [newRespostasList, setNewRespostasList] = useState<{ resposta: string; peso: number }[]>([]);
  const [creating, setCreating] = useState(false);

  // New user form
  const [newUser, setNewUser] = useState("");
  const [newSenha, setNewSenha] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/perguntas").then((r) => r.json()),
      fetch("/api/usuarios").then((r) => r.json()),
      fetch("/api/usuarios/roles").then((r) => r.json()),
    ])
      .then(([perguntasData, usersData, rolesData]) => {
        setPerguntas(perguntasData);
        setUsers(usersData);
        setRoles(rolesData);
      })
      .catch(() => toast.error("Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, []);

  const createPergunta = async () => {
    if (!newDesc) {
      toast.error("Preencha a descrição da pergunta");
      return;
    }
    if (newRespostasList.length === 0) {
      toast.error("Adicione pelo menos uma resposta");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/perguntas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: newDesc,
          tipoPergunta: newTipoPergunta,
          respostas: newRespostasList,
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setPerguntas((prev) => [...prev, data]);
      setNewDesc("");
      setNewRespostasList([]);
      toast.success("Pergunta criada!");
    } catch {
      toast.error("Erro ao criar pergunta");
    } finally {
      setCreating(false);
    }
  };

  const togglePergunta = async (id: string, ativa: boolean) => {
    try {
      const res = await fetch("/api/perguntas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ativa: !ativa }),
      });
      if (!res.ok) throw new Error();
      setPerguntas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ativa: !ativa } : p))
      );
      toast.success("Pergunta atualizada!");
    } catch {
      toast.error("Erro ao atualizar pergunta");
    }
  };

  const createUser = async () => {
    if (!newUser || !newSenha || !newRoleId) {
      toast.error("Preencha todos os campos");
      return;
    }

    setCreatingUser(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: newUser,
          senha: newSenha,
          roleId: newRoleId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      setUsers((prev) => [...prev, data]);
      setNewUser("");
      setNewSenha("");
      toast.success("Usuário criado!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
    } finally {
      setCreatingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="perguntas" className="space-y-6">
      <TabsList className="bg-white/[0.05] border border-white/10 p-1 rounded-xl h-auto">
        <TabsTrigger
          value="perguntas"
          className="text-slate-400 data-[state=active]:bg-[#1599BD] data-[state=active]:text-white rounded-lg text-sm font-medium px-5 py-2 transition-all"
        >
          Perguntas
        </TabsTrigger>
        <TabsTrigger
          value="usuarios"
          className="text-slate-400 data-[state=active]:bg-[#1599BD] data-[state=active]:text-white rounded-lg text-sm font-medium px-5 py-2 transition-all"
        >
          Usuários
        </TabsTrigger>
      </TabsList>

      <TabsContent value="perguntas" className="space-y-6">
        {/* Create form */}
        <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Nova Pergunta</h2>
          <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Descrição</label>
                <Input
                  className={inputClass}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Texto da pergunta"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Exibir em</label>
                <Select value={newTipoPergunta} onValueChange={setNewTipoPergunta}>
                  <SelectTrigger className="bg-white/[0.05] border-white/10 text-white rounded-xl h-11 focus:ring-[#1599BD]/40">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#07192a] border-white/10 text-white">
                    <SelectItem value="ambos" className="focus:bg-white/10 focus:text-white">Ambos os formulários</SelectItem>
                    <SelectItem value="form_aberto" className="focus:bg-white/10 focus:text-white">Somente Form Aberto</SelectItem>
                    <SelectItem value="form_fechado" className="focus:bg-white/10 focus:text-white">Somente Form Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Respostas dinâmicas com peso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Respostas</label>
                <button
                  type="button"
                  onClick={() => setNewRespostasList((prev) => [...prev, { resposta: "", peso: 0 }])}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium px-3 h-8 transition-colors duration-200"
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
              {newRespostasList.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    className={`flex-1 ${inputClass}`}
                    placeholder="Texto da resposta"
                    value={item.resposta}
                    onChange={(e) =>
                      setNewRespostasList((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, resposta: e.target.value } : r))
                      )
                    }
                  />
                  <Input
                    className="w-20 bg-white/[0.05] border border-white/10 text-white rounded-xl h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1599BD]/40 placeholder:text-slate-600 text-center"
                    type="number"
                    placeholder="0"
                    value={item.peso}
                    onChange={(e) =>
                      setNewRespostasList((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, peso: Number(e.target.value) } : r))
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setNewRespostasList((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex items-center justify-center w-11 h-11 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-red-500/10 hover:border-red-500/30 transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>

          <button
            onClick={createPergunta}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1599BD] hover:bg-[#014F85] disabled:opacity-50 text-white text-sm font-medium px-5 h-11 transition-colors duration-200"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Pergunta
          </button>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-10"></TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pergunta</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Exibir em</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Respostas</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-right">Ativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {perguntas.map((p) => (
                  <TableRow key={p.id} className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                    <TableCell className="text-slate-500">
                      <GripVertical className="h-4 w-4 cursor-grab" />
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">{p.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/20 text-slate-400 text-[10px]">{p.tipoPergunta ?? "ambos"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {p.respostas.map((r) => (
                          <Badge key={r.id} variant="outline" className="text-[10px] border-white/15 text-slate-400">
                            {r.resposta}{r.peso ? ` · ${r.peso}pt` : ""}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={p.ativa}
                        onCheckedChange={() => togglePergunta(p.id, p.ativa)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="usuarios" className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Novo Usuário</h2>
          <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Login</label>
                <Input
                  className={inputClass}
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  placeholder="usuario"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Senha</label>
                <Input
                  className={inputClass}
                  type="password"
                  value={newSenha}
                  onChange={(e) => setNewSenha(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Role</label>
                <Select value={newRoleId} onValueChange={setNewRoleId}>
                  <SelectTrigger className="bg-white/[0.05] border-white/10 text-white rounded-xl h-11 focus:ring-[#1599BD]/40">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#07192a] border-white/10 text-white">
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id} className="focus:bg-white/10 focus:text-white">
                        {r.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          <button
            onClick={createUser}
            disabled={creatingUser}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1599BD] hover:bg-[#014F85] disabled:opacity-50 text-white text-sm font-medium px-5 h-11 transition-colors duration-200"
          >
            {creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Usuário
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#07192a]/60 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Login</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Role</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id} className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors">
                  <TableCell className="font-medium text-slate-200">{u.user}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-white/20 text-slate-400 text-[10px]">{u.role.role}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
