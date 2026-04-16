"use client";

import { useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const user = (data.get("user") as string).trim();
    const senha = data.get("senha") as string;

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          user,
          senha,
          redirect: false,
        });

        if (result?.error) {
          toast.error("Usuário ou senha inválidos");
        } else {
          router.push("/admin/leads");
        }
      } catch {
        toast.error("Erro ao fazer login");
      }
    });
  };

  return (
    <main
      className="min-h-screen flex flex-col md:flex-row"
      style={{ colorScheme: "light" }}
    >
      <Toaster richColors position="top-center" />

      {/* ── MOBILE: tela inteira com gradiente ── */}
      {/* ── DESKTOP: painel esquerdo marca ── */}
      <div
        className="relative flex flex-col items-center justify-center overflow-hidden
                   min-h-screen md:min-h-0 md:h-auto md:w-[55%] shrink-0"
        style={{
          background:
            "linear-gradient(135deg, #0B284F 0%, #014F85 50%, #1599BD 100%)",
        }}
      >
        {/* Decorações geométricas */}
        <span
          aria-hidden
          className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none select-none"
          style={{
            background:
              "radial-gradient(circle, #18BDD5 0%, transparent 70%)",
            opacity: 0.14,
          }}
        />
        <span
          aria-hidden
          className="absolute -bottom-14 -right-14 w-64 h-64 rounded-full pointer-events-none select-none"
          style={{
            background:
              "radial-gradient(circle, #1599BD 0%, transparent 70%)",
            opacity: 0.1,
          }}
        />
        <span
          aria-hidden
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-105 h-105 rounded-full pointer-events-none select-none"
          style={{
            background:
              "radial-gradient(circle, #014F85 0%, transparent 65%)",
            opacity: 0.3,
          }}
        />

        {/* Logo + tagline (Desktop) */}
        <div className="relative z-10 hidden md:flex flex-col items-center gap-6 px-14">
          <Image
            src="/cdg/photoflow.webp"
            alt="PhotoFlow by Casa da Gráfica"
            width={420}
            height={130}
            priority
            sizes="380px"
            className="w-80 lg:w-96 h-auto object-contain logo-animate"
            style={{ filter: "brightness(0) invert(1)" }}
          />

          <p
            className="text-center text-base leading-relaxed"
            style={{ color: "rgba(255,255,255,0.6)", maxWidth: "320px" }}
          >
            Captação inteligente de leads e fotos para eventos
          </p>
        </div>

        {/* Logo mobile (topo) + card do form (centro-baixo) */}
        <div className="relative z-10 flex md:hidden flex-col items-center justify-end w-full px-6 pt-10 pb-12 gap-6 flex-1">
          {/* Logo mobile */}
          <div className="logo-animate">
            <Image
              src="/cdg/photoflow.webp"
              alt="PhotoFlow by Casa da Gráfica"
              width={280}
              height={86}
              priority
              sizes="180px"
              className="w-44 h-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>

          {/* Card de login — mobile */}
          <div
            className="w-full max-w-sm rounded-2xl px-6 py-8 form-animate"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
            }}
          >
            <div className="mb-6">
              <h1
                className="text-xl font-semibold tracking-tight"
                style={{ color: "#0B284F" }}
              >
                Bem-vindo de volta
              </h1>
              <p className="mt-1 text-sm" style={{ color: "#111111" }}>
                Acesse o painel administrativo
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="user-mobile"
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#0B284F" }}
                >
                  Usuário
                </Label>
                <Input
                  id="user-mobile"
                  name="user"
                  autoComplete="username"
                  placeholder="admin"
                  required
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-[#E6E7E9]
                             focus-visible:ring-1 focus-visible:ring-[#1599BD] focus-visible:border-[#1599BD]
                             placeholder:text-[#BDBFC7]
                             dark:bg-white dark:border-[#E6E7E9] dark:text-zinc-900
                             dark:placeholder:text-[#BDBFC7]
                             transition-shadow duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="senha-mobile"
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#0B284F" }}
                >
                  Senha
                </Label>
                <Input
                  id="senha-mobile"
                  name="senha"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-[#E6E7E9]
                             focus-visible:ring-1 focus-visible:ring-[#1599BD] focus-visible:border-[#1599BD]
                             placeholder:text-[#BDBFC7]
                             dark:bg-white dark:border-[#E6E7E9] dark:text-zinc-900
                             dark:placeholder:text-[#BDBFC7]
                             transition-shadow duration-200"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-11 rounded-xl font-medium
                           bg-[#1599BD] hover:bg-[#014F85] text-white border-0 shadow-none
                           dark:bg-[#1599BD] dark:hover:bg-[#014F85] dark:text-white
                           transition-colors duration-200"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <p
              className="mt-6 text-center text-xs"
              style={{ color: "#BDBFC7" }}
            >
              Acesso restrito · Casa da Gráfica
            </p>
          </div>
        </div>
      </div>

      {/* ── DESKTOP: painel direito (formulário) ── */}
      <div
        className="hidden md:flex flex-1 flex-col items-center justify-center px-6"
        style={{
          background:
            "linear-gradient(160deg, #EBF6FA 0%, #F4FAFE 40%, #FBFBFB 100%)",
        }}
      >
        <div
          className="w-full max-w-sm rounded-2xl px-8 py-10 form-animate"
          style={{
            background:
              "linear-gradient(135deg, #0B284F 0%, #014F85 55%, #1599BD 100%)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 30px 80px rgba(11,40,79,0.22), 0 14px 30px rgba(1,79,133,0.18), 0 2px 10px rgba(11,40,79,0.08)",
            border: "1px solid rgba(24,189,213,0.1)",
          }}
        >
          {/* Header do form */}
          <div className="mb-7">
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ color: "#FFFFFF" }}
            >
              Bem-vindo de volta
            </h1>
            <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.86)" }}>
              Acesse o painel administrativo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="user"
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                Usuário
              </Label>
              <Input
                id="user"
                name="user"
                autoComplete="username"
                placeholder="admin"
                required
                disabled={isPending}
                className="h-11 rounded-xl bg-white/94 border-white/45 text-[#0B284F]
                           focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                           placeholder:text-[#6D7B90]
                           dark:bg-white/94 dark:border-white/45 dark:text-[#0B284F]
                           dark:placeholder:text-[#6D7B90]
                           dark:focus-visible:ring-white dark:focus-visible:border-white
                           transition-shadow duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="senha"
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                Senha
              </Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                disabled={isPending}
                className="h-11 rounded-xl bg-white/94 border-white/45 text-[#0B284F]
                           focus-visible:ring-1 focus-visible:ring-white focus-visible:border-white
                           placeholder:text-[#6D7B90]
                           dark:bg-white/94 dark:border-white/45 dark:text-[#0B284F]
                           dark:placeholder:text-[#6D7B90]
                           dark:focus-visible:ring-white dark:focus-visible:border-white
                           transition-shadow duration-200"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl font-medium
                         bg-white hover:bg-[#EAF8FC] text-[#0B284F] border border-white/35 shadow-none
                         dark:bg-white dark:hover:bg-[#EAF8FC] dark:text-[#0B284F]
                         transition-colors duration-200"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p
            className="mt-8 text-center text-xs"
            style={{ color: "rgba(255,255,255,0.74)" }}
          >
            Acesso restrito · Casa da Gráfica
          </p>
        </div>
      </div>
    </main>
  );
}
