import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tipos = await prisma.perguntaTipo.findMany({ orderBy: { descricao: "asc" } });
    return NextResponse.json(tipos);
  } catch (error) {
    console.error("GET pergunta tipos error:", error);
    return NextResponse.json({ error: "Erro ao buscar tipos" }, { status: 500 });
  }
}
