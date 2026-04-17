"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Square,
  Pause,
  Play,
  Upload,
  Loader2,
  Send,
} from "lucide-react";
import { toast } from "sonner";

interface CloserRecorderProps {
  leadCloserId: string;
  onUploadComplete: () => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "paused" | "stopped";

export function CloserRecorder({
  leadCloserId,
  onUploadComplete,
  disabled,
}: CloserRecorderProps) {
  const [mode, setMode] = useState<"record" | "upload">("record");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setElapsed(
        Math.floor((now - startTimeRef.current + pausedTimeRef.current) / 1000)
      );
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // collect data every second
      setRecordingState("recording");
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsed(0);
      startTimer();
    } catch {
      toast.error(
        "Não foi possível acessar o microfone. Verifique as permissões."
      );
    }
  }, [startTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      stopTimer();
      pausedTimeRef.current += Date.now() - startTimeRef.current;
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      startTimeRef.current = Date.now();
      startTimer();
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      stopTimer();
    }
  }, [stopTimer]);

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState("idle");
    setElapsed(0);
    pausedTimeRef.current = 0;
  }, [audioUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 25MB.");
      return;
    }

    setUploadFile(file);
    const url = URL.createObjectURL(file);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(url);
  };

  const handleSend = async () => {
    const file =
      mode === "record" && audioBlob
        ? new File([audioBlob], "gravacao.webm", { type: "audio/webm" })
        : uploadFile;

    if (!file) {
      toast.error("Nenhum áudio para enviar");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("duracao", String(elapsed));

      const res = await fetch(`/api/closer/${leadCloserId}/audio`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Áudio enviado! Transcrição em andamento.");
        onUploadComplete();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao enviar áudio");
      }
    } catch {
      toast.error("Erro ao enviar áudio");
    } finally {
      setUploading(false);
    }
  };

  const hasAudio =
    (mode === "record" && audioBlob !== null) ||
    (mode === "upload" && uploadFile !== null);

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setMode("record");
            resetRecording();
            setUploadFile(null);
          }}
          disabled={disabled}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "record"
              ? "border-[#18BDD5]/35 bg-[#18BDD5]/15 text-[#18BDD5]"
              : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
          }`}
        >
          <Mic className="mr-2 inline h-4 w-4" />
          Gravar
        </button>
        <button
          onClick={() => {
            setMode("upload");
            resetRecording();
            setUploadFile(null);
          }}
          disabled={disabled}
          className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            mode === "upload"
              ? "border-[#18BDD5]/35 bg-[#18BDD5]/15 text-[#18BDD5]"
              : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
          }`}
        >
          <Upload className="mr-2 inline h-4 w-4" />
          Upload
        </button>
      </div>

      {/* Record mode */}
      {mode === "record" && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          {/* Timer */}
          <div className="mb-4 text-center">
            <p className="font-mono text-4xl font-bold text-white">
              {formatTime(elapsed)}
            </p>
            {recordingState === "recording" && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs text-red-400">Gravando...</span>
              </div>
            )}
            {recordingState === "paused" && (
              <p className="mt-2 text-xs text-amber-400">Pausado</p>
            )}
          </div>

          {/* Waveform bars (simple animation) */}
          {(recordingState === "recording" || recordingState === "paused") && (
            <div className="mb-4 flex items-end justify-center gap-1 h-10">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-[#18BDD5] transition-all ${
                    recordingState === "recording"
                      ? "animate-pulse"
                      : "opacity-30"
                  }`}
                  style={{
                    height:
                      recordingState === "recording"
                        ? `${Math.random() * 100}%`
                        : "20%",
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {recordingState === "idle" && (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="rounded-xl bg-red-600 px-6 text-white hover:bg-red-700"
              >
                <Mic className="mr-2 h-4 w-4" />
                Iniciar Gravação
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </Button>
                <Button
                  onClick={stopRecording}
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Retomar
                </Button>
                <Button
                  onClick={stopRecording}
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  <Square className="mr-2 h-4 w-4" />
                  Parar
                </Button>
              </>
            )}

            {recordingState === "stopped" && (
              <Button
                onClick={resetRecording}
                variant="outline"
                className="rounded-xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
              >
                Nova Gravação
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.webm,.mp3,.wav,.m4a,.ogg"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full rounded-xl border-2 border-dashed border-white/15 bg-white/3 p-8 text-center transition-colors hover:border-[#18BDD5]/40 hover:bg-white/5"
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-white/40" />
            <p className="text-sm text-white/60">
              {uploadFile
                ? uploadFile.name
                : "Clique para selecionar um arquivo de áudio"}
            </p>
            <p className="mt-1 text-xs text-white/30">
              WebM, MP3, WAV, M4A, OGG — máx. 25MB
            </p>
          </button>
        </div>
      )}

      {/* Audio preview */}
      {audioUrl && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#18BDD5]/70">
            Pré-visualização
          </p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {/* Send button */}
      {hasAudio && (
        <Button
          onClick={handleSend}
          disabled={uploading || disabled}
          className="w-full rounded-xl bg-[#18BDD5] py-3 text-[#04121f] font-semibold hover:bg-[#15a8be] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Enviando..." : "Enviar e Transcrever"}
        </Button>
      )}
    </div>
  );
}
