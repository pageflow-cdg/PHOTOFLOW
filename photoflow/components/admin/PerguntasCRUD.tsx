"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="perguntas" className="space-y-4">
      <TabsList>
        <TabsTrigger value="perguntas">Perguntas</TabsTrigger>
        <TabsTrigger value="usuarios">Usuários</TabsTrigger>
      </TabsList>

      <TabsContent value="perguntas" className="space-y-6">
        {/* Create form */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Pergunta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Texto da pergunta"
                />
              </div>
              <div className="space-y-2">
                <Label>Exibir em</Label>
                <Select value={newTipoPergunta} onValueChange={setNewTipoPergunta}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambos">Ambos os formulários</SelectItem>
                    <SelectItem value="form_aberto">Somente Form Aberto</SelectItem>
                    <SelectItem value="form_fechado">Somente Form Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Respostas dinâmicas com peso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Respostas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewRespostasList((prev) => [...prev, { resposta: "", peso: 0 }])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>
              {newRespostasList.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    className="flex-1"
                    placeholder="Texto da resposta"
                    value={item.resposta}
                    onChange={(e) =>
                      setNewRespostasList((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, resposta: e.target.value } : r))
                      )
                    }
                  />
                  <Input
                    className="w-20"
                    type="number"
                    placeholder="Peso"
                    value={item.peso}
                    onChange={(e) =>
                      setNewRespostasList((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, peso: Number(e.target.value) } : r))
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setNewRespostasList((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>

            <Button onClick={createPergunta} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar Pergunta
            </Button>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Pergunta</TableHead>
                  <TableHead>Exibir em</TableHead>
                  <TableHead>Respostas</TableHead>
                  <TableHead>Ativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perguntas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-zinc-400 cursor-grab" />
                    </TableCell>
                    <TableCell className="font-medium">{p.descricao}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.tipoPergunta ?? "ambos"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {p.respostas.map((r) => (
                          <Badge key={r.id} variant="outline" className="text-xs">
                            {r.resposta}{r.peso ? ` · ${r.peso}pt` : ""}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={p.ativa}
                        onCheckedChange={() => togglePergunta(p.id, p.ativa)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="usuarios" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Novo Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Login</Label>
                <Input
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  placeholder="usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={newSenha}
                  onChange={(e) => setNewSenha(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRoleId} onValueChange={setNewRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={createUser} disabled={creatingUser}>
              {creatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Criar Usuário
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.user}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{u.role.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
