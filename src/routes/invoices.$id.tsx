import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { invoices, fmt, paymentHistory } from "@/lib/mock-data";
import { BanknoteArrowUp, SplitSquareHorizontal, CheckCircle2, AlertOctagon, FileX } from "lucide-react";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice Detail — CollectFlow" }] }),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const inv = invoices.find((i) => i.id === id) ?? invoices[0];
  const outstanding = inv.amount - inv.paid;

  return (
    <AppShell
      title={`Invoice ${inv.number}`}
      subtitle={
        <>
          <Link to="/clients/$id" params={{ id: inv.clientId }} className="text-brand hover:underline">
            {inv.clientName}
          </Link>{" "}
          · Issued {inv.invoiceDate} · Due {inv.dueDate}
        </> as any
      }
      actions={
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5">
            <SplitSquareHorizontal className="size-3.5" /> Split Payment
          </button>
          <Link to="/payments/new" className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-xs font-semibold hover:bg-brand/90 inline-flex items-center gap-1.5">
            <BanknoteArrowUp className="size-3.5" /> Record Payment
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="panel p-6">
            <h2 className="font-bold mb-4">Invoice Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Invoice #", inv.number],
                ["Status", <StatusPill tone={inv.status === "overdue" ? "danger" : inv.status === "disputed" ? "warning" : inv.status === "partial" ? "brand" : "success"}>{inv.status}</StatusPill>],
                ["Invoice Date", inv.invoiceDate],
                ["Due Date", inv.dueDate],
                ["Amount", fmt(inv.amount, 2)],
                ["Paid", fmt(inv.paid, 2)],
                ["Outstanding", fmt(outstanding, 2)],
                ["Aging", `${inv.agingDays}d`],
              ].map(([k, v], i) => (
                <div key={i}>
                  <div className="label-kicker text-[9px] mb-1">{k as string}</div>
                  <div className="text-sm font-semibold">{v as any}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-bold mb-4">Payment History</h2>
            <div className="space-y-3">
              {paymentHistory.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <div className="text-sm font-semibold">{fmt(p.amount, 2)} · {p.mode}</div>
                    <div className="text-xs text-muted-foreground">{p.date} · {p.ref} · {p.against}</div>
                  </div>
                  <StatusPill tone="success">Cleared</StatusPill>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-bold mb-4">Settlement History</h2>
            <div className="text-sm text-muted-foreground italic">
              1 partial settlement recorded — {fmt(inv.paid, 2)} allocated on 2026-05-30 (IMPS #445120).
            </div>
          </div>

          <div className="panel p-6">
            <h2 className="font-bold mb-4">Timeline</h2>
            <div className="relative pl-6 space-y-5">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-primary/10" />
              {[
                { label: "Invoice issued", at: inv.invoiceDate, tone: "brand" },
                { label: "Assigned to " + inv.assignedTo, at: inv.invoiceDate, tone: "neutral" },
                { label: "Payment reminder email sent", at: "2026-06-01", tone: "neutral" },
                { label: `Partial payment ${fmt(inv.paid, 2)} received`, at: "2026-05-30", tone: "success" },
                { label: "Overdue — 30 days", at: inv.dueDate, tone: "warning" },
              ].map((t, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[18px] top-1.5 size-3 rounded-full ring-4 ${
                    t.tone === "success" ? "bg-success ring-success/15" :
                    t.tone === "warning" ? "bg-warning ring-warning/15" :
                    t.tone === "brand" ? "bg-brand ring-brand/15" : "bg-muted-foreground ring-muted"
                  }`} />
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="panel p-6 bg-primary text-primary-foreground">
            <div className="label-kicker text-[9px] opacity-60 mb-1">Outstanding</div>
            <div className="text-3xl font-bold tabular-nums">{fmt(outstanding, 2)}</div>
            <div className="text-xs opacity-70 mt-1">of {fmt(inv.amount, 2)}</div>
            <div className="mt-4 h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: `${(inv.paid / inv.amount) * 100}%` }} />
            </div>
            <div className="mt-2 text-[11px] opacity-70">{Math.round((inv.paid / inv.amount) * 100)}% collected</div>
          </div>

          <div className="panel p-6">
            <h3 className="font-bold text-sm mb-3">Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: BanknoteArrowUp, label: "Record Payment", tone: "brand" },
                { icon: SplitSquareHorizontal, label: "Split Payment" },
                { icon: CheckCircle2, label: "Mark as Paid" },
                { icon: AlertOctagon, label: "Mark Disputed", tone: "warning" },
                { icon: FileX, label: "Write Off", tone: "danger" },
              ].map((a) => (
                <button key={a.label} className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-2 border transition-colors ${
                  a.tone === "brand" ? "bg-brand text-brand-foreground border-brand hover:bg-brand/90" :
                  a.tone === "warning" ? "border-warning/30 text-warning hover:bg-warning/10" :
                  a.tone === "danger" ? "border-danger/30 text-danger hover:bg-danger/10" :
                  "border-primary/10 bg-card hover:bg-muted"
                }`}>
                  <a.icon className="size-3.5" /> {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <h3 className="font-bold text-sm mb-3">Notes</h3>
            <div className="text-xs text-muted-foreground italic">
              "Client acknowledged invoice on Jun 4; requested extension till Jul 20 due to quarter-end cash cycle."
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
