import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { outstandingTrend, agingBuckets, fmt, fmtCompact } from "@/lib/mock-data";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Collection Analytics — CollectFlow" }] }),
  component: Analytics,
});

const riskData = [
  { name: "Low", value: 62, color: "var(--success)" },
  { name: "Medium", value: 44, color: "var(--warning)" },
  { name: "High", value: 26, color: "#f97316" },
  { name: "Critical", value: 10, color: "var(--danger)" },
];

const heatmap = Array.from({ length: 12 }, (_, m) =>
  Array.from({ length: 7 }, (_, b) => ({ m, b, v: Math.round(Math.random() * 100) }))
).flat();

function Analytics() {
  return (
    <AppShell
      title="Collection Analytics"
      subtitle="Executive KPIs, aging heatmap, risk distribution, and cash recovery forecast."
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[
          { l: "Collection %", v: "78.4%", sub: "+1.2pt MoM" },
          { l: "Recovery Rate", v: "84%", sub: "6M avg" },
          { l: "Avg Days to Collect", v: "42d", sub: "−4d QoQ" },
          { l: "Overdue %", v: "19.9%", sub: "+2pt" },
          { l: "Collector Productivity", v: "$142k", sub: "per FTE / mo" },
          { l: "Cash Forecast (30d)", v: "$540k", sub: "78% confidence" },
        ].map((k) => (
          <div key={k.l} className="kpi-card">
            <div className="label-kicker text-[9px] mb-1">{k.l}</div>
            <div className="text-xl font-bold tabular-nums">{k.v}</div>
            <div className="text-[10px] text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 panel p-6">
          <h3 className="font-bold mb-4">Outstanding & Payment Trend (6M)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={outstandingTrend}>
                <defs>
                  <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                <Area type="monotone" dataKey="outstanding" stroke="var(--brand)" strokeWidth={2} fill="url(#ga)" />
                <Line type="monotone" dataKey="collected" stroke="var(--success)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 panel p-6">
          <h3 className="font-bold mb-4">Client Risk Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskData} innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {riskData.map((d, i) => (<Cell key={i} fill={d.color} />))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {riskData.map((r) => (
              <div key={r.name} className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: r.color }} />
                <span className="text-muted-foreground">{r.name}</span>
                <span className="ml-auto font-mono font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8 panel p-6">
          <h3 className="font-bold mb-4">Aging Heatmap</h3>
          <div className="flex gap-3">
            <div className="flex flex-col justify-between text-[10px] text-muted-foreground py-1">
              {agingBuckets.map((b) => <span key={b.bucket}>{b.bucket}</span>)}
            </div>
            <div className="flex-1 grid grid-cols-12 gap-1">
              {heatmap.map((c, i) => (
                <div
                  key={i}
                  className="aspect-square rounded"
                  style={{
                    background: `color-mix(in oklab, var(--brand) ${c.v}%, transparent)`,
                  }}
                  title={`${c.v}`}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-muted-foreground">
            <span>Cool</span>
            <div className="h-1 flex-1 rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklab, var(--brand) 5%, transparent), var(--brand))" }} />
            <span>Hot</span>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 panel p-6 bg-primary text-primary-foreground">
          <h3 className="font-bold mb-4 text-sm">Cash Recovery Forecast</h3>
          <div className="space-y-3 text-sm">
            {[
              { period: "Next 7 days", amount: 142_000, conf: 88 },
              { period: "Next 30 days", amount: 540_000, conf: 78 },
              { period: "Next 60 days", amount: 812_000, conf: 62 },
              { period: "Next 90 days", amount: 1_040_000, conf: 48 },
            ].map((f) => (
              <div key={f.period} className="pb-3 border-b border-white/10 last:border-0">
                <div className="flex justify-between items-baseline">
                  <span className="opacity-70 text-xs">{f.period}</span>
                  <span className="font-mono font-bold">{fmtCompact(f.amount)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${f.conf}%` }} />
                  </div>
                  <span className="opacity-60">{f.conf}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
