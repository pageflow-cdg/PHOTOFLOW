import { FormAbertoFoto } from "@/components/admin/FormAbertoFoto";

export default function FormFechadoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Formulário Fechado</h1>
        <p className="text-zinc-500">Crie leads e faça upload de fotos</p>
      </div>
      <FormAbertoFoto />
    </div>
  );
}
