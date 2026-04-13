import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createPerguntaSchema = z.object({
  descricao: z.string().min(3),
  tipoId: z.string(),
  pontoId: z.string(),
  respostas: z.array(z.string()).optional(),
  ordem: z.number().optional(),
});

export async function GET() {
  try {
    const perguntas = await prisma.pergunta.findMany({
      include: {
        tipo: true,
        ponto: true,
        respostas: true,
      },
      orderBy: { ordem: "asc" },
    });

    return NextResponse.json(perguntas);
  } catch (error) {
    console.error("GET perguntas error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perguntas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPerguntaSchema.parse(body);

    const pergunta = await prisma.pergunta.create({
      data: {
        descricao: parsed.descricao,
        tipoId: parsed.tipoId,
        pontoId: parsed.pontoId,
        ordem: parsed.ordem || 0,
        respostas: parsed.respostas
          ? {
              create: parsed.respostas.map((r) => ({ resposta: r })),
            }
          : undefined,
      },
      include: { tipo: true, ponto: true, respostas: true },
    });

    return NextResponse.json(pergunta, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("POST pergunta error:", error);
    return NextResponse.json(
      { error: "Erro ao criar pergunta" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const pergunta = await prisma.pergunta.update({
      where: { id },
      data,
      include: { tipo: true, ponto: true, respostas: true },
    });

    return NextResponse.json(pergunta);
  } catch (error) {
    console.error("PATCH pergunta error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pergunta" },
      { status: 500 }
    );
  }
}
