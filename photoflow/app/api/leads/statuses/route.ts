import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const statuses = await prisma.leadStatus.findMany({
      orderBy: { status: "asc" },
    });
    return NextResponse.json(statuses);
  } catch (error) {
    console.error("GET lead statuses error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar statuses" },
      { status: 500 }
    );
  }
}
