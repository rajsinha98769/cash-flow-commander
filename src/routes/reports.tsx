import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { collectorPerformance, fmt, fmtCompact } from "@/lib/mock-data";
import { FileBarChart, Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Collection Reports — CollectFlow" }] }),
  component: Reports,
});

const reports = [
  { name: "Outstanding Report", desc: "Full aging & outstanding snapshot", period: "Live", format: "Excel · PDF" },
  { name: "Collector Performance", desc: "Recovery vs target by collector", period: "MTD", format: "PDF" },
  { name: "Recovery Trend", desc: "6-month collection trend", period: "6M rolling", format: "Excel" },
  { name: "Invoice Aging", desc: "Detailed aging by invoice", period: "As of today", format: "Excel" },
  { name: "Client Aging", desc: "Aging by client, sorted by risk", period: "As of today", format: "Excel · PDF" },
  { name: "Collection Efficiency", desc: "DSO, CEI, and turnover ratios", period: "Quarterly", format: "PDF" },
  { name: "Payment Trend", desc: "Payment volume by mode & bank", period: "3M rolling", format: "Excel" },
  { name: "Top Defaulters", desc: "Clients with critical overdue", period: "Live", format: "PDF" },
  { name: "Monthly Recovery", desc: "Recovery per month & collector", period: "12M", format: "Excel" },
  { name: "Write-off Report", desc: "Approved & pending write-offs", period: "YTD", format: "PDF" },
];

function Reports() {
  return (
    <AppShell title="Collection Reports" subtitle="Executive and operational reports for finance leadership and audit.">
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 xl:col-span-8 panel p-6">
          <h2 className="font-bold mb-4">Collector Performance (MTD)</h2>
          <div className="space-y-4">
            {collectorPerformance.map((c) => {
              const pct = (c.collected / c.target) * 100;
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-brand/10 text-brand grid place-items-center text-xs font-bold">
                        {c.name.split(" ").map((s) => s[0]).join("")}
                      </div>
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.active} active accounts</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono tabular-nums">{fmt(c.collected)} / {fmtCompact(c.target)}</span>
                      <StatusPill tone={pct >= 90 ? "success" : pct >= 70 ? "warning" : "danger"}>{pct.toFixed(0)}%</StatusPill>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${pct >= 90 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-danger"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 panel p-6 bg-primary text-primary-foreground">
          <h2 className="font-bold text-sm mb-4">Executive Snapshot</h2>
          <div className="space-y-4 text-sm">
            {[
              ["DSO", "42 days"],
              ["CEI", "78.4%"],
              ["Bad Debt Ratio", "1.9%"],
              ["Recovery Rate", "84%"],
              ["Avg. Payment Size", "$14,240"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-white/10 pb-2">
                <span className="opacity-70">{k}</span>
                <span className="font-mono font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {reports.map((r) => (
          <div key={r.name} className="panel p-4 flex items-center gap-3 hover:border-brand/30 transition-colors">
            <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center">
              <FileBarChart className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">{r.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{r.desc}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{r.period} · {r.format}</div>
            </div>
            <button className="size-8 rounded-lg border border-primary/10 grid place-items-center hover:bg-muted">
              <Download className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
