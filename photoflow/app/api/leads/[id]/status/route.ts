import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VALID_TRANSITIONS: Record<string, string[]> = {
  novo: ["em_atendimento", "foto_pendente"],
  em_atendimento: ["foto_pendente", "em_closer"],
  em_closer: ["foto_pendente", "finalizado", "em_atendimento"],
  foto_pendente: ["foto_entregue", "em_atendimento", "em_closer"],
  foto_entregue: ["finalizado", "foto_pendente"],
};

const updateStatusSchema = z.object({
  statusId: z.string(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statusId } = updateStatusSchema.parse(body);

    // Get current lead status
    const currentLead = await prisma.lead.findUnique({
      where: { id },
      include: { status: true },
    });

    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Get target status
    const targetStatus = await prisma.leadStatus.findUnique({
      where: { id: statusId },
    });

    if (!targetStatus) {
      return NextResponse.json(
        { error: "Status não encontrado" },
        { status: 404 }
      );
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[currentLead.status.status];
    if (allowed && !allowed.includes(targetStatus.status)) {
      return NextResponse.json(
        {
          error: `Transição de status inválida: ${currentLead.status.status} → ${targetStatus.status}`,
        },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { statusId },
      include: { status: true },
    });

    await prisma.leadStatusHistorico.create({
      data: {
        statusId,
        leadId: id,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("PATCH lead status error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 500 }
    );
  }
}
