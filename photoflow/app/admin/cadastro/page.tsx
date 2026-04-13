import { PerguntasCRUD } from "@/components/admin/PerguntasCRUD";

export default function CadastroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cadastro</h1>
        <p className="text-zinc-500">Gerencie perguntas e usuários</p>
      </div>
      <PerguntasCRUD />
    </div>
  );
}
