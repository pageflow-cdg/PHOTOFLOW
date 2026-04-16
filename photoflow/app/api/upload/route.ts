import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const leadId = formData.get("leadId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId é obrigatório" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato não suportado. Use JPG, PNG, WebP ou HEIC." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 10MB." },
        { status: 400 }
      );
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    const filename = `fotos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const blob = await put(filename, file, { access: "private" });

    const fotoStatus = await prisma.fotoStatus.findUnique({
      where: { status: "pronta" },
    });

    if (!fotoStatus) {
      return NextResponse.json(
        { error: "Status de foto não encontrado" },
        { status: 500 }
      );
    }

    const foto = await prisma.foto.create({
      data: {
        fotoUrl: blob.url,
        statusId: fotoStatus.id,
        leadId,
      },
    });

    await prisma.fotoStatusHistorico.create({
      data: {
        statusId: fotoStatus.id,
        fotoId: foto.id,
      },
    });

    return NextResponse.json({ url: blob.url, fotoId: foto.id });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}
