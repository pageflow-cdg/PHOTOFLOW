import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const leadCloser = await prisma.leadCloser.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            status: true,
            fotos: { include: { status: true } },
          },
        },
        responsavel: { select: { id: true, user: true } },
      },
    });

    if (!leadCloser) {
      return NextResponse.json(
        { error: "Registro de closer não encontrado" },
        { status: 404 }
      );
    }

    // Only the assigned closer or admin can access
    const user = session.user as { id?: string; role?: string };
    if (user.role !== "admin" && user.id !== leadCloser.responsavelId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    return NextResponse.json(leadCloser);
  } catch (error) {
    console.error("GET closer error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar closer" },
      { status: 500 }
    );
  }
}
