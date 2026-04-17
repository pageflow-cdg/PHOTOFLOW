import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const VALID_TRANSITIONS: Record<string, string[]> = {
  em_atendimento: ["em_closer"],
};

const createCloserSchema = z.object({
  leadId: z.string().min(1, "leadId é obrigatório"),
  responsavelId: z.string().min(1, "responsavelId é obrigatório"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };
    const isAdmin = user.role === "admin";

    const closers = await prisma.leadCloser.findMany({
      where: isAdmin ? {} : { responsavelId: user.id },
      include: {
        lead: {
          include: {
            status: true,
          },
        },
        responsavel: {
          select: { id: true, user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(closers);
  } catch (error) {
    console.error("GET closers error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar closers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, responsavelId } = createCloserSchema.parse(body);

    // Verify lead exists and get current status
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { status: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[lead.status.status];
    if (!allowed || !allowed.includes("em_closer")) {
      return NextResponse.json(
        {
          error: `Transição de status inválida: ${lead.status.status} → em_closer`,
        },
        { status: 400 }
      );
    }

    // Verify responsavel exists
    const responsavel = await prisma.user.findUnique({
      where: { id: responsavelId },
    });
    if (!responsavel) {
      return NextResponse.json(
        { error: "Responsável não encontrado" },
        { status: 404 }
      );
    }

    // Get em_closer status
    const emCloserStatus = await prisma.leadStatus.findUnique({
      where: { status: "em_closer" },
    });
    if (!emCloserStatus) {
      return NextResponse.json(
        { error: "Status em_closer não encontrado. Execute o seed." },
        { status: 500 }
      );
    }

    // Create LeadCloser + update lead status + create history in a transaction
    const leadCloser = await prisma.$transaction(async (tx) => {
      const closer = await tx.leadCloser.create({
        data: {
          leadId,
          responsavelId,
        },
        include: {
          lead: { include: { status: true } },
          responsavel: { select: { id: true, user: true } },
        },
      });

      await tx.lead.update({
        where: { id: leadId },
        data: { statusId: emCloserStatus.id },
      });

      await tx.leadStatusHistorico.create({
        data: {
          statusId: emCloserStatus.id,
          leadId,
        },
      });

      return closer;
    });

    return NextResponse.json(leadCloser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST closer error:", error);
    return NextResponse.json(
      { error: "Erro ao criar atribuição de closer" },
      { status: 500 }
    );
  }
}
