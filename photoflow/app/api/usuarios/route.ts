import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
  user: z.string().min(3),
  senha: z.string().min(6),
  roleId: z.string(),
});

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });

    const safeUsers = users.map(({ senha, ...rest }) => rest);
    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("GET usuarios error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { user: parsed.user },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Usuário já existe" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(parsed.senha, 12);
    const user = await prisma.user.create({
      data: {
        user: parsed.user,
        senha: hashedPassword,
        roleId: parsed.roleId,
      },
      include: { role: true },
    });

    const { senha, ...safeUser } = user;
    return NextResponse.json(safeUser, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("POST usuario error:", error);
    return NextResponse.json(
      { error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
