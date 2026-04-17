import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getDownloadUrl } from "@vercel/blob";

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

    if (!leadCloser.audioUrl) {
      return NextResponse.json(
        { error: "Nenhum áudio encontrado para transcrever" },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      await prisma.leadCloser.update({
        where: { id },
        data: {
          transcricaoStatus: "erro",
          erro: "OPENAI_API_KEY não configurada no servidor",
        },
      });
      return NextResponse.json(
        { error: "Chave da OpenAI não configurada" },
        { status: 500 }
      );
    }

    // Mark as processing
    await prisma.leadCloser.update({
      where: { id },
      data: { transcricaoStatus: "processando", erro: null },
    });

    try {
      // Download the audio from Vercel Blob
      // Public blobs: fetch directly. Private blobs: generate signed download URL.
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
      let fetchUrl = leadCloser.audioUrl;
      if (blobToken && !leadCloser.audioUrl.includes(".public.blob.")) {
        fetchUrl = await getDownloadUrl(leadCloser.audioUrl);
      }
      const audioResponse = await fetch(fetchUrl);
      if (!audioResponse.ok) {
        throw new Error(`Falha ao baixar áudio do Blob: HTTP ${audioResponse.status}`);
      }
      const audioBuffer = await audioResponse.arrayBuffer();

      // Determine file extension from URL
      const urlPath = new URL(leadCloser.audioUrl).pathname;
      const ext = urlPath.split(".").pop() || "webm";

      // Build FormData for Whisper API
      const whisperForm = new FormData();
      const audioBlob = new Blob([audioBuffer], {
        type: `audio/${ext === "mp3" ? "mpeg" : ext}`,
      });
      whisperForm.append("file", audioBlob, `audio.${ext}`);
      whisperForm.append("model", "whisper-1");
      whisperForm.append("language", "pt");

      const whisperResponse = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: whisperForm,
        }
      );

      if (!whisperResponse.ok) {
        const errorData = await whisperResponse.text();
        throw new Error(`Whisper API error: ${whisperResponse.status} - ${errorData}`);
      }

      const result = await whisperResponse.json();

      await prisma.leadCloser.update({
        where: { id },
        data: {
          transcricao: result.text,
          transcricaoStatus: "concluida",
          erro: null,
        },
      });

      return NextResponse.json({ transcricao: result.text });
    } catch (transcriptionError) {
      const errorMessage =
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Erro desconhecido na transcrição";

      await prisma.leadCloser.update({
        where: { id },
        data: {
          transcricaoStatus: "erro",
          erro: errorMessage,
        },
      });

      console.error("Transcription error:", transcriptionError);
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("POST transcrever error:", error);
    return NextResponse.json(
      { error: "Erro ao transcrever áudio" },
      { status: 500 }
    );
  }
}
