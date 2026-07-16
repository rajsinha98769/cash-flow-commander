import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, StatusPill, useMe } from "@/components/app-shell";
import { InvoiceForm } from "@/components/invoice-form";
import { getDashboard } from "@/lib/api/dashboard";
import { listClients } from "@/lib/api/clients";
import { listRecentPayments } from "@/lib/api/payments";
import { fmt } from "@/lib/derive";
import { Plus, FilePlus2, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — CollectFlow" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: user } = useMe();
  const canEdit = user?.role === "manager";
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data: totals } = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: () => listClients() });
  const { data: recent = [] } = useQuery({ queryKey: ["recent-payments"], queryFn: () => listRecentPayments() });

  const topOutstanding = [...clients]
    .filter((c) => c.summary.outstanding > 0)
    .sort((a, b) => b.summary.outstanding - a.summary.outstanding)
    .slice(0, 6);

  return (
    <AppShell
      title="Collections Dashboard"
      subtitle="Overall receivables, collections, and pending outstanding."
      actions={
        canEdit ? (
          <>
            <button
              onClick={() => setUploadOpen(true)}
              className="px-3 h-9 inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-card text-sm font-semibold hover:bg-muted"
            >
              <FilePlus2 className="size-4" /> Upload Invoice
            </button>
            <Link
              to="/clients"
              search={{ new: true }}
              className="px-4 h-9 inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 shadow-sm"
            >
              <Plus className="size-4" /> Add Client
            </Link>
          </>
        ) : null
      }
    >
      {/* Primary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Kpi label="Total Outstanding" value={fmt(totals?.totalOutstanding ?? 0)} big />
        <Kpi label="Collected (this month)" value={fmt(totals?.collectedThisMonth ?? 0)} tone="text-success" big />
        <Kpi label="Pending Collection" value={fmt(totals?.pendingCollection ?? 0)} big />
        <Kpi label="Overdue" value={fmt(totals?.overdue ?? 0)} tone="text-danger" big />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        <Kpi label="Total Receivable" value={fmt(totals?.totalReceivable ?? 0)} />
        <Kpi label="Collected (all-time)" value={fmt(totals?.collected ?? 0)} tone="text-success" />
        <Kpi label="Advance on account" value={fmt(totals?.advance ?? 0)} />
        <Kpi label="Written off" value={fmt(totals?.writtenOff ?? 0)} tone="text-warning" />
        <Kpi label="Collection rate" value={`${totals?.collectionRate ?? 0}%`} />
        <Kpi label="Clients w/ o/s" value={String(totals?.clientsWithOutstanding ?? 0)} />
        <Kpi label="Overdue invoices" value={String(totals?.overdueInvoices ?? 0)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top outstanding clients */}
        <section className="panel overflow-hidden">
          <div className="px-5 py-3 border-b border-primary/5 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Top Outstanding Clients</h2>
            <Link to="/clients" className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-0.5">
              View all <ArrowUpRight className="size-3" />
            </Link>
          </div>
          {topOutstanding.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No outstanding yet.{" "}
              <Link to="/clients" className="text-brand font-semibold inline-flex items-center gap-0.5">
                <Plus className="size-3" /> Add a client
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-primary/5">
              {topOutstanding.map((c) => (
                <Link
                  key={c.id}
                  to="/clients/$id"
                  params={{ id: c.id }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.summary.invoiceCount + c.summary.proformaCount} entries
                      {c.summary.overdue > 0 ? ` · ${fmt(c.summary.overdue, 0)} overdue` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums text-sm">{fmt(c.summary.outstanding, 0)}</div>
                    {c.summary.overdue > 0 ? <StatusPill tone="danger">overdue</StatusPill> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent payments */}
        <section className="panel overflow-hidden">
          <div className="px-5 py-3 border-b border-primary/5">
            <h2 className="font-semibold text-sm">Recent Payments</h2>
          </div>
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
          ) : (
            <div className="divide-y divide-primary/5">
              {recent.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to="/clients/$id"
                  params={{ id: p.clientId }}
                  className="flex items-center justify-between px-5 py-3 hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{p.clientName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.paymentDate} · {p.mode}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </div>
                  </div>
                  <div className="font-bold tabular-nums text-sm text-success">{fmt(p.amount, 0)}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {uploadOpen ? (
        <InvoiceForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          open
          onClose={() => setUploadOpen(false)}
        />
      ) : null}
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  tone,
  big,
}: {
  label: string;
  value: string;
  tone?: string;
  big?: boolean;
}) {
  return (
    <div className="panel p-4">
      <div className="label-kicker text-[9px] mb-1">{label}</div>
      <div className={`${big ? "text-2xl" : "text-lg"} font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
