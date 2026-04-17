import { FormAbertoFoto } from "@/components/admin/FormAbertoFoto";

export default async function FormFechadoPage({
  searchParams,
}: {
  searchParams: Promise<{ tel?: string }>;
}) {
  const { tel } = await searchParams;
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07192a]/85 px-6 py-5 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-xl md:px-7 md:py-6">
        <span
          aria-hidden
          className="absolute -left-14 top-0 h-32 w-32 rounded-full bg-[#18BDD5]/12 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute right-0 top-0 h-32 w-32 rounded-full bg-[#1599BD]/10 blur-3xl"
        />
        <div className="relative z-10">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#18BDD5]">
            Captação interna
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Formulário Fechado
          </h1>
        </div>
      </section>
      <FormAbertoFoto initialTel={tel} />
    </div>
  );
}
