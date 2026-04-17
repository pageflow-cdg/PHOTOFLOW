import { NextResponse } from "next/server";

export async function GET() {
  // Valores de ponto disponíveis para respostas (peso fixo, sem tabela no banco)
  const pontos = [1, 2, 3, 5, 10].map((ponto, i) => ({ id: String(i + 1), ponto }));
  return NextResponse.json(pontos);
}
