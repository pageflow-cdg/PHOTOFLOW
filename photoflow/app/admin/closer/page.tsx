import { CloserList } from "@/components/admin/CloserList";

export default function CloserPage() {
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07192a]/85 px-6 py-5 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-xl md:px-7 md:py-6">
        <span
          aria-hidden
          className="absolute -left-14 top-0 h-32 w-32 rounded-full bg-violet-500/12 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute right-0 top-0 h-32 w-32 rounded-full bg-violet-600/10 blur-3xl"
        />

        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-violet-400">
            Atendimento de vendas
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Closer
          </h1>
        </div>
      </section>

      <CloserList />
    </div>
  );
}
