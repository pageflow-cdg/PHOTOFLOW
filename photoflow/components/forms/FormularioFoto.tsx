"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadFotos } from "./UploadFotos";
import { Camera, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface FormularioFotoProps {
  leadId: string;
}

export function FormularioFoto({ leadId }: FormularioFotoProps) {
  const [success, setSuccess] = useState(false);

  const handleUploadComplete = async () => {
    try {
      // Update lead status to foto_pendente
      const statusRes = await fetch("/api/leads");
      if (!statusRes.ok) throw new Error();

      // Get status id for foto_pendente
      const statusReq = await fetch(`/api/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: "" }), // Will be resolved on server
      });

      setSuccess(true);
    } catch {
      setSuccess(true); // Show success anyway - photos were uploaded
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Fotos enviadas!</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Suas fotos serão entregues em breve!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="text-center mb-8">
        <Camera className="h-12 w-12 mx-auto text-zinc-900 dark:text-white mb-3" />
        <h1 className="text-2xl font-bold">PhotoFlow</h1>
        <p className="text-zinc-500 mt-1">Envie suas fotos do evento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadFotos leadId={leadId} onUploadComplete={handleUploadComplete} />
        </CardContent>
      </Card>
    </div>
  );
}
