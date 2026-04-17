import Image from "next/image";
import { FormularioCompleto } from "@/components/forms/FormularioCompleto";
import { Toaster } from "sonner";

export default function FormEventPage() {
  return (
    <main
      className="relative min-h-screen flex flex-col items-center overflow-hidden"
      style={{
        colorScheme: "light",
        background: "linear-gradient(135deg, #0B284F 0%, #014F85 50%, #1599BD 100%)",
      }}
    >
      <Toaster richColors position="top-center" />

      {/* Decorações radiais */}
      <span
        aria-hidden
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none select-none"
        style={{
          background: "radial-gradient(circle, #18BDD5 0%, transparent 70%)",
          opacity: 0.14,
        }}
      />
      <span
        aria-hidden
        className="absolute -bottom-14 -right-14 w-64 h-64 rounded-full pointer-events-none select-none"
        style={{
          background: "radial-gradient(circle, #1599BD 0%, transparent 70%)",
          opacity: 0.1,
        }}
      />
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none select-none"
        style={{
          background: "radial-gradient(circle, #014F85 0%, transparent 65%)",
          opacity: 0.3,
        }}
      />

      {/* Overlay de rabiscos SVG */}
      <div aria-hidden className="absolute inset-0 opacity-[0.10] pointer-events-none select-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="scribbles" x="0" y="0" width="500" height="500" patternUnits="userSpaceOnUse">
              <path d="M30,120 Q80,40 150,120 T270,120" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M350,60 C380,20 420,100 450,60" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M100,280 Q160,220 220,280 T340,280" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M40,400 C90,350 140,450 190,400" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M300,350 Q340,310 380,350 T460,350" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M200,50 C230,20 260,80 290,50" stroke="white" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M420,420 Q440,380 460,420 T500,420" stroke="white" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M10,200 C40,170 70,230 100,200" stroke="white" fill="none" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="420" cy="200" r="18" stroke="white" fill="none" strokeWidth="2" />
              <circle cx="80" cy="380" r="12" stroke="white" fill="none" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#scribbles)" />
        </svg>
      </div>

      {/* Logo */}
      <div className="relative z-10 pt-8 sm:pt-12 pb-2 logo-animate">
        <Image
          src="/cdg/photoflow.webp"
          alt="PhotoFlow by Casa da Gráfica"
          width={280}
          height={86}
          priority
          sizes="(max-width: 640px) 176px, 208px"
          className="w-44 sm:w-52 h-auto object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      </div>

      {/* Formulário */}
      <div className="relative z-10 w-full flex-1">
        <FormularioCompleto />
      </div>

      {/* Footer */}
      <p className="relative z-10 pb-6 text-xs text-white/40">
        Casa da Gráfica · PhotoFlow
      </p>
    </main>
  );
}
