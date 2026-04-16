import { LeadsTable } from "@/components/admin/LeadsTable";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#07192a]/85 px-6 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#18BDD5]">
          Gestão de leads
        </p>
        <h1 className="mt-3 text-3xl font-bold text-white">Leads</h1>
      </section>
      <LeadsTable />
    </div>
  );
}
