import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

    const foto = await prisma.foto.update({
      where: { id },
      data: { statusId },
      include: { status: true },
    });

    await prisma.fotoStatusHistorico.create({
      data: {
        statusId,
        fotoId: id,
      },
    });

    return NextResponse.json(foto);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("PATCH foto status error:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status da foto" },
      { status: 500 }
    );
  }
}
