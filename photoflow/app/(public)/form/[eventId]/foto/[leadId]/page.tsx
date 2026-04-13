import { FormularioFoto } from "@/components/forms/FormularioFoto";
import { Toaster } from "sonner";

export default async function FotoUploadPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Toaster richColors position="top-center" />
      <FormularioFoto leadId={leadId} />
    </main>
  );
}
