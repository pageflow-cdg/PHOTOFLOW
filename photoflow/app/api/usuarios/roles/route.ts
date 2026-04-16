import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.userRole.findMany({ orderBy: { role: "asc" } });
    return NextResponse.json(roles);
  } catch (error) {
    console.error("GET roles error:", error);
    return NextResponse.json({ error: "Erro ao buscar roles" }, { status: 500 });
  }
}
