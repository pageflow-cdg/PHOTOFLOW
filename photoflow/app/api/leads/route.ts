import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createLeadSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  statusSlug: z.string().optional(),
  respostas: z
    .array(
      z.object({
        perguntaId: z.string(),
        respostaId: z.string().optional(),
        respostaTexto: z.string().optional(),
      })
    )
    .optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = { status };
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: "insensitive" } },
        { telefone: { contains: search } },
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo + "T23:59:59.999Z");
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          status: true,
          fotos: { include: { status: true } },
          respostas: {
            include: { pergunta: true, resposta: true },
          },
          historico: {
            include: { status: true },
            orderBy: { createdAt: "desc" },
          },
          closers: {
            include: {
              responsavel: { select: { id: true, user: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      data: leads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET leads error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createLeadSchema.parse(body);

    const statusSlug = parsed.statusSlug || "novo";
    const leadStatus = await prisma.leadStatus.findUnique({
      where: { status: statusSlug },
    });

    if (!leadStatus) {
      return NextResponse.json(
        { error: "Status não encontrado" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        nome: parsed.nome,
        telefone: parsed.telefone,
        email: parsed.email || null,
        statusId: leadStatus.id,
      },
    });

    // Create status history
    await prisma.leadStatusHistorico.create({
      data: {
        statusId: leadStatus.id,
        leadId: lead.id,
      },
    });

    // Save answers
    if (parsed.respostas && parsed.respostas.length > 0) {
      const respostasValidas = parsed.respostas.filter(
        (r) => r.respostaId || (r.respostaTexto && r.respostaTexto.trim())
      );
      if (respostasValidas.length > 0) {
        await prisma.leadResposta.createMany({
          data: respostasValidas.map((r) => ({
            perguntaId: r.perguntaId,
            respostaId: r.respostaId ?? null,
            respostaTexto: r.respostaTexto ?? null,
            leadId: lead.id,
          })),
        });

        // Calculate pontuacao
        const respostasComPeso = respostasValidas.filter((r) => r.respostaId);
        if (respostasComPeso.length > 0) {
          const perguntaIds = respostasComPeso.map((r) => r.perguntaId);
          const perguntas = await prisma.pergunta.findMany({
            where: { id: { in: perguntaIds } },
            include: { respostas: true },
          });

          let somaEscolhidos = 0;
          let somaMaximos = 0;

          for (const pergunta of perguntas) {
            const maxPeso = Math.max(...pergunta.respostas.map((r) => r.peso));
            const escolhida = respostasComPeso.find((r) => r.perguntaId === pergunta.id);
            const respostaEscolhida = pergunta.respostas.find(
              (r) => r.id === escolhida?.respostaId
            );

            if (respostaEscolhida && maxPeso > 0) {
              somaEscolhidos += respostaEscolhida.peso;
              somaMaximos += maxPeso;
            }
          }

          if (somaMaximos > 0) {
            const pontuacao = somaEscolhidos / somaMaximos;
            await prisma.lead.update({
              where: { id: lead.id },
              data: { pontuacao },
            });
          }
        }
      }
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST lead error:", error);
    return NextResponse.json(
      { error: "Erro ao criar lead" },
      { status: 500 }
    );
  }
}
