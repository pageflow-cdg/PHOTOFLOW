import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const ALLOWED_AUDIO_TYPES = [
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
];

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB (Whisper limit)

export async function POST(
  request: NextRequest,
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
    });

    if (!leadCloser) {
      return NextResponse.json(
        { error: "Registro de closer não encontrado" },
        { status: 404 }
      );
    }

    // Only the assigned closer or admin can upload
    const user = session.user as { id?: string; role?: string };
    if (user.role !== "admin" && user.id !== leadCloser.responsavelId) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const duracao = formData.get("duracao") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de áudio enviado" },
        { status: 400 }
      );
    }

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato de áudio não suportado. Use WebM, MP3, WAV, M4A ou OGG.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 25MB." },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob (public store, UUID path for obscurity)
    const originalExt = file.name.split(".").pop()?.toLowerCase() || "webm";
    const filename = `closers/${id}/${randomUUID()}.${originalExt}`;
    const contentType = file.type || "audio/webm";
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    // Update LeadCloser with audio info
    await prisma.leadCloser.update({
      where: { id },
      data: {
        audioUrl: blob.url,
        audioDuracao: duracao ? parseInt(duracao, 10) : null,
        transcricaoStatus: "processando",
      },
    });

    // Trigger transcription asynchronously (fire and forget)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    fetch(`${baseUrl}/api/closer/${id}/transcrever`, {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    }).catch((err) => {
      console.error("Erro ao disparar transcrição:", err);
    });

    return NextResponse.json(
      { message: "Áudio enviado. Transcrição em andamento." },
      { status: 202 }
    );
  } catch (error) {
    console.error("POST closer audio error:", error);
    return NextResponse.json(
      { error: "Erro ao enviar áudio" },
      { status: 500 }
    );
  }
}
