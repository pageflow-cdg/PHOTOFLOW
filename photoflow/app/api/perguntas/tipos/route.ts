import { NextResponse } from "next/server";

export async function GET() {
  // Tipos de pergunta definidos no enum TipoPergunta do schema
  const tipos = [
    { id: "form_aberto", descricao: "Form Aberto" },
    { id: "form_fechado", descricao: "Form Fechado" },
    { id: "ambos", descricao: "Ambos" },
  ];
  return NextResponse.json(tipos);
}
