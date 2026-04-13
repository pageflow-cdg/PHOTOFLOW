import { LeadsTable } from "@/components/admin/LeadsTable";

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leads</h1>
        <p className="text-zinc-500">Gerencie os leads do evento</p>
      </div>
      <LeadsTable />
    </div>
  );
}
