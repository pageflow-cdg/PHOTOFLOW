import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function SucessoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 text-center px-4">
      <CheckCircle className="h-20 w-20 text-green-500 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Tudo certo!</h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md">
        Suas fotos serão entregues em breve! Fique atento ao stand para retirar
        suas fotos impressas.
      </p>
    </main>
  );
}
