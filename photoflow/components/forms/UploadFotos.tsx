"use client";

import { useCallback, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface UploadFotosProps {
  leadId: string;
  onUploadComplete?: (fotos: { url: string; fotoId: string }[]) => void;
}

interface UploadedFoto {
  url: string;
  fotoId: string;
  preview: string;
}

export function UploadFotos({ leadId, onUploadComplete }: UploadFotosProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedFoto[]>([]);
  const [progress, setProgress] = useState(0);

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} excede 10MB`);
        return false;
      }
      if (!["image/jpeg", "image/png", "image/webp", "image/heic"].includes(f.type)) {
        toast.error(`${f.name}: formato não suportado`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    const results: UploadedFoto[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("leadId", leadId);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Erro no upload");
        }

        const data = await res.json();
        results.push({ url: data.url, fotoId: data.fotoId, preview: previews[i] });
        setProgress(((i + 1) / files.length) * 100);
      } catch (error) {
        toast.error(`Erro ao enviar ${files[i].name}: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
      }
    }

    setUploaded((prev) => [...prev, ...results]);
    setFiles([]);
    setPreviews([]);
    setUploading(false);
    setProgress(0);

    if (results.length > 0) {
      toast.success(`${results.length} foto(s) enviada(s) com sucesso!`);
      onUploadComplete?.(results.map(({ url, fotoId }) => ({ url, fotoId })));
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        onClick={() => document.getElementById("file-upload")?.click()}
      >
        <Upload className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Arraste suas fotos aqui ou <span className="font-semibold text-zinc-900 dark:text-white">clique para selecionar</span>
        </p>
        <p className="text-xs text-zinc-400 mt-1">JPG, PNG, WebP ou HEIC — Máx. 10MB</p>
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Preview area */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <Image src={preview} alt={`Preview ${index}`} fill className="object-cover" />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded photos */}
      {uploaded.length > 0 && (
        <div>
          <p className="text-sm font-medium text-green-600 mb-2">Fotos enviadas:</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {uploaded.map((foto, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 ring-2 ring-green-500">
                <Image src={foto.preview} alt={`Uploaded ${index}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {uploading && (
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
          <div
            className="bg-zinc-900 dark:bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {files.length > 0 && (
        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Enviar {files.length} foto(s)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
