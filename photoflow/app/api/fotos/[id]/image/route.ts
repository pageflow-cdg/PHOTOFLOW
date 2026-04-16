import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const foto = await prisma.foto.findUnique({ where: { id } });
    if (!foto) {
      return NextResponse.json({ error: "Foto não encontrada" }, { status: 404 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Token não configurado" }, { status: 500 });
    }

    const blobRes = await fetch(foto.fotoUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!blobRes.ok) {
      return NextResponse.json({ error: "Erro ao buscar imagem" }, { status: 502 });
    }

    const contentType = blobRes.headers.get("content-type") || "image/jpeg";

    return new NextResponse(blobRes.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET foto image error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
