import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { agingBuckets, fmt, fmtCompact } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/aging")({
  head: () => ({ meta: [{ title: "Aging Analysis — CollectFlow" }] }),
  component: Aging,
});

const tones = ["bg-success", "bg-success/70", "bg-warning", "bg-warning", "bg-danger/70", "bg-danger", "bg-danger"];

function Aging() {
  const total = agingBuckets.reduce((s, b) => s + b.amount, 0);
  return (
    <AppShell
      title="Aging Analysis"
      subtitle="Receivables distribution across aging buckets with recovery percentages."
    >
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {agingBuckets.map((b, i) => (
          <div key={b.bucket} className="kpi-card">
            <div className="flex items-center gap-2 mb-2">
              <span className={`size-2 rounded-full ${tones[i]}`} />
              <div className="label-kicker text-[9px]">{b.bucket}</div>
            </div>
            <div className="text-lg font-bold tabular-nums">{fmtCompact(b.amount)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">
              {b.count} invoices · {b.clients} clients
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px]">
              <span className="text-muted-foreground">Recovery</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${b.recovery > 60 ? "bg-success" : b.recovery > 30 ? "bg-warning" : "bg-danger"}`} style={{ width: `${b.recovery}%` }} />
              </div>
              <span className="font-semibold">{b.recovery}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 panel p-6">
          <h2 className="font-bold mb-4">Outstanding by Aging Bucket</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="bucket" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={fmtCompact} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="amount" fill="var(--brand)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 panel p-6">
          <h2 className="font-bold mb-4">Distribution</h2>
          <div className="space-y-3">
            {agingBuckets.map((b, i) => {
              const pct = (b.amount / total) * 100;
              return (
                <div key={b.bucket}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{b.bucket}</span>
                    <span className="font-mono">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${tones[i]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
