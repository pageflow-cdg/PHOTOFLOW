import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const dateFilter: Record<string, unknown> = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) dateFilter.lte = new Date(dateTo + "T23:59:59.999Z");

    const where = Object.keys(dateFilter).length > 0
      ? { createdAt: dateFilter }
      : {};

    const [
      totalLeads,
      totalFotos,
      leadsPorStatus,
      leads,
      leadsComFoto,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.foto.count({
        where: dateFilter.gte || dateFilter.lte
          ? { createdAt: dateFilter }
          : {},
      }),
      prisma.lead.groupBy({
        by: ["statusId"],
        where,
        _count: { id: true },
      }),
      prisma.lead.findMany({
        where,
        select: { createdAt: true },
      }),
      prisma.lead.count({
        where: {
          ...where,
          fotos: { some: {} },
        },
      }),
    ]);

    // Get status names
    const statuses = await prisma.leadStatus.findMany();
    const statusMap = new Map(statuses.map(s => [s.id, s.status]));

    const leadsPorStatusWithNames = leadsPorStatus.map(item => ({
      status: statusMap.get(item.statusId) || item.statusId,
      count: item._count.id,
    }));

    // Group leads by day
    const leadsPorDia = leads.reduce<Record<string, number>>((acc, lead) => {
      const date = lead.createdAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const leadsPorDiaArray = Object.entries(leadsPorDia)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate average score
    const respostas = await prisma.leadResposta.findMany({
      where: where.createdAt
        ? { lead: { createdAt: dateFilter } }
        : {},
      include: {
        resposta: true,
      },
    });

    const totalPontos = respostas.reduce(
      (sum, r) => sum + (r.resposta?.peso ?? 0),
      0
    );
    const mediaPontuacao = respostas.length > 0
      ? totalPontos / respostas.length
      : 0;

    const taxaConversao = totalLeads > 0
      ? (leadsComFoto / totalLeads) * 100
      : 0;

    return NextResponse.json({
      totalLeads,
      totalFotos,
      leadsPorDia: leadsPorDiaArray,
      leadsPorStatus: leadsPorStatusWithNames,
      taxaConversao: Math.round(taxaConversao * 100) / 100,
      mediaPontuacao: Math.round(mediaPontuacao * 100) / 100,
    });
  } catch (error) {
    console.error("GET relatorio error:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
