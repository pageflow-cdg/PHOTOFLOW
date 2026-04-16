import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pontos = await prisma.perguntaPonto.findMany({ orderBy: { ponto: "asc" } });
    return NextResponse.json(pontos);
  } catch (error) {
    console.error("GET pergunta pontos error:", error);
    return NextResponse.json({ error: "Erro ao buscar pontos" }, { status: 500 });
  }
}
