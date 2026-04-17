"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { RelatorioData } from "@/types";
import { Users, Camera, TrendingUp, Award } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  novo: "#18BDD5",
  em_atendimento: "#F59E0B",
  foto_pendente: "#64748B",
  foto_entregue: "#10B981",
  finalizado: "#22C55E",
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? "#64748B";
}

interface BarTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

function BarTooltip({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#07192a] px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50">{label}</p>
      <p className="font-semibold text-[#18BDD5]">{payload[0].value} lead(s)</p>
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number }[];
}

function PieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#07192a] px-3 py-2 text-xs shadow-xl">
      <p className="text-white/50">{payload[0].name.replace(/_/g, " ")}</p>
      <p className="font-semibold text-[#18BDD5]">{payload[0].value} lead(s)</p>
    </div>
  );
}

export function RelatorioCharts() {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);

    setLoading(true);
    fetch(`/api/relatorio?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => toast.error("Erro ao carregar relatório"))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-36 rounded-xl bg-white/6 animate-pulse" />
          <div className="h-4 w-5 rounded bg-white/4 animate-pulse" />
          <div className="h-9 w-36 rounded-xl bg-white/6 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/6 animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-white/6 animate-pulse" />
          <div className="h-72 rounded-2xl bg-white/6 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const axisStyle = { fill: "rgba(255,255,255,0.40)", fontSize: 11 };

  const kpis = [
    { label: "Total Leads",     value: data.totalLeads,      Icon: Users,      iconColor: "#18BDD5", iconBg: "bg-[#18BDD5]/15"      },
    { label: "Total Fotos",     value: data.totalFotos,      Icon: Camera,     iconColor: "#10B981", iconBg: "bg-emerald-500/15"    },
    { label: "Conversão",       value: `${data.taxaConversao}%`, Icon: TrendingUp, iconColor: "#F59E0B", iconBg: "bg-amber-500/15"     },
    { label: "Média Pontuação", value: data.mediaPontuacao,  Icon: Award,      iconColor: "#8B5CF6", iconBg: "bg-violet-500/15"     },
  ];

  return (
    <div className="space-y-4">
      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 w-40 rounded-xl border border-white/10 bg-white/4 px-3 text-sm text-white scheme-dark focus:outline-none focus:ring-1 focus:ring-[#18BDD5]/50"
        />
        <span className="text-sm text-white/40">até</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 w-40 rounded-xl border border-white/10 bg-white/4 px-3 text-sm text-white scheme-dark focus:outline-none focus:ring-1 focus:ring-[#18BDD5]/50"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="h-9 px-3 rounded-xl border border-white/10 bg-white/4 text-sm text-white/50 hover:text-white hover:bg-white/8 transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(({ label, value, Icon, iconColor, iconBg }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/8 bg-white/4 p-4 flex items-center gap-3"
          >
            <div className={`shrink-0 flex items-center justify-center h-9 w-9 rounded-xl ${iconBg}`}>
              <Icon className="h-4 w-4" style={{ color: iconColor }} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-white/45">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Bar chart — Leads por Dia */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <p className="mb-4 text-sm font-semibold text-white">Leads por Dia</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.leadsPorDia} margin={{ left: -20, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="0"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={(props) => (
                  <BarTooltip
                    active={props.active}
                    payload={props.payload as unknown as { value: number }[] | undefined}
                    label={props.label as string | undefined}
                  />
                )}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="count" fill="#18BDD5" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — Distribuição por Status */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <p className="mb-4 text-sm font-semibold text-white">Distribuição por Status</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.leadsPorStatus}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="count"
                nameKey="status"
              >
                {data.leadsPorStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip
                content={(props) => (
                  <PieTooltip
                    active={props.active}
                    payload={props.payload as unknown as { name: string; value: number }[] | undefined}
                  />
                )}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                    {value.replace(/_/g, " ")}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
