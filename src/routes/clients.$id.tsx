import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, RiskDot, StatusPill } from "@/components/app-shell";
import { clients, invoices, paymentHistory, ledgerEntries, activityFeed, fmt } from "@/lib/mock-data";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  BanknoteArrowUp,
  SplitSquareHorizontal,
  AlertOctagon,
  Paperclip,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/clients/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Client 360 — CollectFlow` },
      { name: "description", content: `Client Collection 360 workspace for ${params.id}.` },
    ],
  }),
  component: Client360,
});

const TABS = ["Outstanding", "Payments", "Ledger", "Follow-ups", "Documents"] as const;

function Client360() {
  const { id } = Route.useParams();
  const client = clients.find((c) => c.id === id) ?? clients[0];
  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Outstanding");

  return (
    <AppShell title={client.name} subtitle={`${client.gstin} · ${client.region} region · Collector: ${client.collector}`}>
      {/* Client header card */}
      <div className="panel p-6 mb-6">
        <div className="flex items-start justify-between mb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-xl bg-brand/10 text-brand grid place-items-center text-lg font-bold">
              {client.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <RiskDot risk={client.risk} />
                <StatusPill tone={client.status === "legal" ? "danger" : client.status === "hold" ? "warning" : "success"}>
                  {client.status}
                </StatusPill>
                <span className="text-[11px] text-muted-foreground">Score: {client.collectionScore}/100</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {client.contact} · {client.email} · {client.phone}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="h-9 px-3 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <Phone className="size-3.5" /> Call
            </button>
            <button className="h-9 px-3 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <Mail className="size-3.5" /> Email
            </button>
            <Link to="/payments/new" className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-xs font-semibold hover:bg-brand/90 inline-flex items-center gap-1.5">
              <BanknoteArrowUp className="size-3.5" /> Record Payment
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { l: "Current Balance", v: fmt(client.outstanding, 2) },
            { l: "Total Outstanding", v: fmt(client.outstanding, 2) },
            { l: "Overdue", v: fmt(client.overdue, 2), tone: "text-danger" },
            { l: "Advance Balance", v: fmt(client.advance, 2), tone: "text-success" },
            { l: "Credit Limit", v: fmt(client.creditLimit) },
          ].map((k) => (
            <div key={k.l} className="p-3 rounded-lg bg-muted/50">
              <div className="label-kicker text-[9px] mb-1">{k.l}</div>
              <div className={`text-lg font-bold tabular-nums ${k.tone ?? ""}`}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-primary/5 mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 h-10 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Outstanding" && (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                <th className="p-4 text-left">Invoice #</th>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Due</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-right">Paid</th>
                <th className="p-4 text-right">Balance</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Aging</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-primary/5 hover:bg-muted/30">
                  <td className="p-4 font-mono text-xs font-semibold">
                    <Link to="/invoices/$id" params={{ id: inv.id }} className="hover:text-brand">
                      {inv.number}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{inv.invoiceDate}</td>
                  <td className="p-4 text-muted-foreground text-xs">{inv.dueDate}</td>
                  <td className="p-4 text-right tabular-nums">{fmt(inv.amount, 2)}</td>
                  <td className="p-4 text-right tabular-nums text-success">{fmt(inv.paid, 2)}</td>
                  <td className="p-4 text-right tabular-nums font-semibold">{fmt(inv.amount - inv.paid, 2)}</td>
                  <td className="p-4"><StatusPill tone={inv.status === "overdue" ? "danger" : inv.status === "disputed" ? "warning" : inv.status === "partial" ? "brand" : "neutral"}>{inv.status}</StatusPill></td>
                  <td className={`p-4 text-right text-xs font-medium ${inv.agingDays > 30 ? "text-danger" : "text-warning"}`}>{inv.agingDays}d</td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-3 text-xs">
                      <Link to="/payments/new" className="text-brand font-semibold hover:underline inline-flex items-center gap-1"><BanknoteArrowUp className="size-3" />Pay</Link>
                      <Link to="/payments/allocate" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><SplitSquareHorizontal className="size-3" />Split</Link>
                      <Link to="/disputes" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><AlertOctagon className="size-3" />Dispute</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Payments" && (
        <div className="panel p-6">
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-primary/10" />
            {paymentHistory.map((p, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[18px] top-1.5 size-3 rounded-full bg-success ring-4 ring-success/15" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{fmt(p.amount, 2)} received via {p.mode}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.date} · Ref {p.ref} · Adjusted against {p.against} · {p.collector}
                    </div>
                    {p.remarks !== "—" ? <div className="text-xs text-muted-foreground mt-1 italic">{p.remarks}</div> : null}
                  </div>
                  <StatusPill tone="success">Cleared</StatusPill>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Ledger" && (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Description</th>
                <th className="p-4 text-right">Debit</th>
                <th className="p-4 text-right">Credit</th>
                <th className="p-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((e, i) => (
                <tr key={i} className={`border-b border-primary/5 hover:bg-muted/30 ${e.type === "Opening" || e.type === "Closing" ? "bg-muted/40 font-semibold" : ""}`}>
                  <td className="p-4 text-xs">{e.date}</td>
                  <td className="p-4"><StatusPill tone={e.type === "Payment" ? "success" : e.type === "Invoice" ? "brand" : "neutral"}>{e.type}</StatusPill></td>
                  <td className="p-4 text-sm">{e.description}</td>
                  <td className="p-4 text-right tabular-nums">{e.debit ? fmt(e.debit, 2) : "—"}</td>
                  <td className="p-4 text-right tabular-nums text-success">{e.credit ? fmt(e.credit, 2) : "—"}</td>
                  <td className="p-4 text-right tabular-nums font-semibold">{fmt(e.balance, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Follow-ups" && (
        <div className="panel p-6">
          <div className="relative pl-6 space-y-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-primary/10" />
            {activityFeed.map((a) => {
              const iconMap = {
                payment: BanknoteArrowUp,
                ptp: Calendar,
                call: Phone,
                dispute: AlertOctagon,
                escalation: AlertOctagon,
                email: Mail,
                "broken-ptp": AlertOctagon,
              } as const;
              const Icon = (iconMap as any)[a.type] ?? MessageSquare;
              return (
                <div key={a.id} className="relative">
                  <div className={`absolute -left-[22px] top-0 size-6 rounded-full grid place-items-center ${
                    a.type === "payment" ? "bg-success/15 text-success" :
                    a.type === "escalation" || a.type === "broken-ptp" ? "bg-danger/15 text-danger" :
                    "bg-brand/10 text-brand"
                  }`}>
                    <Icon className="size-3" />
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-sm">{a.text}</div>
                      <div className="text-xs text-muted-foreground">{a.at} · {a.collector}</div>
                    </div>
                    <StatusPill tone="neutral">{a.type}</StatusPill>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "Documents" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "INV-9021.pdf", type: "Invoice PDF", size: "142 KB", icon: FileText },
            { name: "IMPS-445120.pdf", type: "Payment Proof", size: "88 KB", icon: Paperclip },
            { name: "Statement-Jun26.pdf", type: "Statement", size: "310 KB", icon: FileText },
            { name: "PO-8823.pdf", type: "Supporting", size: "212 KB", icon: FileText },
            { name: "email-thread.eml", type: "Email Attachment", size: "34 KB", icon: Mail },
            { name: "CN-0142.pdf", type: "Credit Note", size: "58 KB", icon: FileText },
          ].map((d) => (
            <div key={d.name} className="panel p-4 flex items-center gap-3 hover:border-brand/30 transition-colors">
              <div className="size-10 rounded-lg bg-muted grid place-items-center">
                <d.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{d.name}</div>
                <div className="text-[11px] text-muted-foreground">{d.type} · {d.size}</div>
              </div>
              <button className="text-xs font-semibold text-brand hover:underline">View</button>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
