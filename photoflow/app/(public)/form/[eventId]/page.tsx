import { FormularioCompleto } from "@/components/forms/FormularioCompleto";
import { Toaster } from "sonner";

export default function FormEventPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <Toaster richColors position="top-center" />
      <FormularioCompleto />
    </main>
  );
}
