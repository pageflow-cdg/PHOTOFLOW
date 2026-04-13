import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const leadId = searchParams.get("leadId");

    const where: Record<string, unknown> = {};
    if (status) where.status = { status };
    if (leadId) where.leadId = leadId;

    const fotos = await prisma.foto.findMany({
      where,
      include: {
        status: true,
        lead: { select: { id: true, nome: true, telefone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(fotos);
  } catch (error) {
    console.error("GET fotos error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar fotos" },
      { status: 500 }
    );
  }
}
