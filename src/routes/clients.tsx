import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, RiskDot, StatusPill } from "@/components/app-shell";
import { clients, fmt } from "@/lib/mock-data";
import { Search, Filter } from "lucide-react";

export const Route = createFileRoute("/clients")({
  head: () => ({ meta: [{ title: "Clients Receivable — CollectFlow" }, { name: "description", content: "Client-wise outstanding receivables with filters and quick access to 360° view." }] }),
  component: ClientsList,
});

function ClientsList() {
  return (
    <AppShell
      title="Clients Receivable"
      subtitle="Client-wise outstanding summary — search, filter, and open a Collection 360 workspace."
    >
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2 px-3 h-9 rounded-lg border border-primary/10 bg-card text-sm w-72">
          <Search className="size-4 text-muted-foreground" />
          <input placeholder="Search by client, GSTIN, contact…" className="bg-transparent outline-none flex-1 text-sm" />
        </div>
        {["All Outstanding", "Aging > 60d", "Assigned to me", "On Hold", "Region: West"].map((f, i) => (
          <button key={f} className={`h-9 px-3 rounded-lg text-xs font-medium transition-colors ${i === 0 ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted"}`}>
            {f}
          </button>
        ))}
        <button className="ml-auto h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted transition-colors">
          <Filter className="size-3.5" /> Advanced Filter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((c) => (
          <Link
            key={c.id}
            to="/clients/$id"
            params={{ id: c.id }}
            className="panel p-5 hover:border-brand/30 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RiskDot risk={c.risk} />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{c.region}</span>
                </div>
                <h3 className="font-bold text-base truncate group-hover:text-brand transition-colors">{c.name}</h3>
                <div className="text-[11px] text-muted-foreground">{c.gstin}</div>
              </div>
              <StatusPill tone={c.status === "legal" ? "danger" : c.status === "hold" ? "warning" : c.status === "watch" ? "warning" : "success"}>
                {c.status}
              </StatusPill>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="label-kicker text-[9px]">Outstanding</div>
                <div className="text-lg font-bold tabular-nums">{fmt(c.outstanding, 2)}</div>
              </div>
              <div>
                <div className="label-kicker text-[9px]">Overdue</div>
                <div className={`text-lg font-bold tabular-nums ${c.overdue > 0 ? "text-danger" : "text-muted-foreground"}`}>
                  {fmt(c.overdue, 2)}
                </div>
              </div>
              <div>
                <div className="label-kicker text-[9px]">Invoices</div>
                <div className="text-sm font-semibold">{c.invoiceCount}</div>
              </div>
              <div>
                <div className="label-kicker text-[9px]">Oldest Pending</div>
                <div className="text-sm font-semibold">{c.oldestInvoiceDays}d</div>
              </div>
            </div>
            <div className="pt-4 border-t border-primary/5 flex items-center justify-between text-[11px]">
              <div className="text-muted-foreground">
                Collector: <span className="text-foreground font-medium">{c.collector}</span>
              </div>
              <div className="text-muted-foreground">
                Next: <span className="text-brand font-medium">{c.nextFollowup}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
