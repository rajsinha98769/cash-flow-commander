import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, RiskDot, StatusPill } from "@/components/app-shell";
import { followups, recentPayments, clients, fmt } from "@/lib/mock-data";
import { Phone, Calendar, Target, Award } from "lucide-react";

export const Route = createFileRoute("/workspace")({
  head: () => ({ meta: [{ title: "Collector Workspace — CollectFlow" }] }),
  component: Workspace,
});

function Workspace() {
  const myPortfolio = clients.slice(0, 4);
  return (
    <AppShell title="My Workspace" subtitle="Sarah Jenkins · Senior Collector · Portfolio $312,400 across 34 clients">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Today's Follow-ups", v: "8", sub: "3 high-priority", icon: Phone, tone: "brand" },
          { l: "Payments Expected", v: "$42,500", sub: "4 clients", icon: Target, tone: "success" },
          { l: "Promises Due", v: "3", sub: "1 overdue", icon: Calendar, tone: "warning" },
          { l: "MTD Recovered", v: "$184,200", sub: "84% of target", icon: Award, tone: "brand" },
        ].map((k) => (
          <div key={k.l} className="kpi-card">
            <div className="flex items-center justify-between mb-2">
              <div className="label-kicker text-[9px]">{k.l}</div>
              <k.icon className={`size-4 ${k.tone === "success" ? "text-success" : k.tone === "warning" ? "text-warning" : "text-brand"}`} />
            </div>
            <div className="text-2xl font-bold">{k.v}</div>
            <div className="text-[11px] text-muted-foreground">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-6 panel p-6">
          <h2 className="font-bold mb-4">Today's Follow-ups</h2>
          <div className="space-y-3">
            {followups.slice(0, 5).map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                <div className={`flex-none w-1 h-10 rounded-full ${f.risk === "critical" ? "bg-danger" : f.risk === "high" ? "bg-warning" : "bg-brand"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{f.client}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{f.note}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold">{fmt(f.outstanding)}</div>
                  <div className="text-[10px] text-brand font-medium">{f.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 xl:col-span-6 panel p-6">
          <h2 className="font-bold mb-4">Recent Payments Received</h2>
          <div className="space-y-3">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="size-9 rounded-lg bg-success/10 text-success grid place-items-center font-bold text-sm">$</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{p.client}</div>
                  <div className="text-[11px] text-muted-foreground">{p.mode} · {p.ref} · {p.when}</div>
                </div>
                <div className="text-sm font-mono font-bold tabular-nums">{fmt(p.amount)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 panel">
          <div className="p-6 border-b border-primary/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">My Portfolio</h2>
              <p className="text-xs text-muted-foreground">High-priority clients assigned to you</p>
            </div>
            <Link to="/clients" className="text-xs text-brand font-semibold hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                <th className="p-4 text-left">Client</th>
                <th className="p-4 text-right">Outstanding</th>
                <th className="p-4 text-right">Overdue</th>
                <th className="p-4 text-center">Risk</th>
                <th className="p-4">Status</th>
                <th className="p-4">Next Action</th>
              </tr>
            </thead>
            <tbody>
              {myPortfolio.map((c) => (
                <tr key={c.id} className="border-b border-primary/5 hover:bg-muted/30">
                  <td className="p-4">
                    <Link to="/clients/$id" params={{ id: c.id }} className="font-semibold hover:text-brand">{c.name}</Link>
                  </td>
                  <td className="p-4 text-right tabular-nums font-medium">{fmt(c.outstanding, 2)}</td>
                  <td className="p-4 text-right tabular-nums text-danger font-medium">{fmt(c.overdue, 2)}</td>
                  <td className="p-4 text-center"><RiskDot risk={c.risk} /></td>
                  <td className="p-4"><StatusPill tone={c.status === "legal" ? "danger" : c.status === "hold" ? "warning" : "success"}>{c.status}</StatusPill></td>
                  <td className="p-4 text-xs text-brand font-medium">{c.nextFollowup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
