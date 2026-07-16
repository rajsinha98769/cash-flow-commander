import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, RiskDot, StatusPill } from "@/components/app-shell";
import { invoices, fmt } from "@/lib/mock-data";
import { Upload, Filter, ArrowUpDown } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Invoice Inbox — CollectFlow" }, { name: "description", content: "Incoming invoices assigned to collectors for outstanding recovery." }] }),
  component: Inbox,
});

function Inbox() {
  return (
    <AppShell
      title="Invoice Inbox"
      subtitle="Invoices received from invoice creators, awaiting collection action."
    >
      <div className="flex items-center gap-2 mb-4">
        <button className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted transition-colors">
          <Filter className="size-3.5" /> All ({invoices.length})
        </button>
        {["Unassigned", "Overdue", "High Priority", "Disputed"].map((f) => (
          <button key={f} className="h-9 px-3 rounded-lg border border-transparent text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted transition-colors">
            <Upload className="size-3.5" /> Upload Invoice
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
              <th className="p-4 font-semibold text-left"><span className="inline-flex items-center gap-1">Invoice # <ArrowUpDown className="size-3" /></span></th>
              <th className="p-4 font-semibold text-left">Client</th>
              <th className="p-4 font-semibold text-left">Invoice Date</th>
              <th className="p-4 font-semibold text-left">Due Date</th>
              <th className="p-4 font-semibold text-right">Invoice Amt</th>
              <th className="p-4 font-semibold text-right">Outstanding</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Assignee</th>
              <th className="p-4 font-semibold text-center">Priority</th>
              <th className="p-4 font-semibold text-right">Aging</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const outstanding = inv.amount - inv.paid;
              const tone =
                inv.status === "overdue" ? "danger" :
                inv.status === "disputed" ? "warning" :
                inv.status === "partial" ? "brand" :
                inv.status === "paid" ? "success" : "neutral";
              return (
                <tr key={inv.id} className="border-b border-primary/5 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs font-semibold">{inv.number}</td>
                  <td className="p-4">
                    <Link to="/clients/$id" params={{ id: inv.clientId }} className="hover:text-brand font-medium">
                      {inv.clientName}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">{inv.invoiceDate}</td>
                  <td className="p-4 text-muted-foreground text-xs">{inv.dueDate}</td>
                  <td className="p-4 text-right tabular-nums">{fmt(inv.amount, 2)}</td>
                  <td className="p-4 text-right tabular-nums font-semibold">{fmt(outstanding, 2)}</td>
                  <td className="p-4"><StatusPill tone={tone as any}>{inv.status}</StatusPill></td>
                  <td className="p-4 text-xs">{inv.assignedTo}</td>
                  <td className="p-4 text-center">
                    <RiskDot risk={inv.priority === "high" ? "high" : inv.priority === "medium" ? "medium" : "low"} />
                  </td>
                  <td className={`p-4 text-right text-xs font-medium ${inv.agingDays > 30 ? "text-danger" : inv.agingDays > 0 ? "text-warning" : "text-muted-foreground"}`}>
                    {inv.agingDays}d
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 text-xs">
                      <Link to="/invoices/$id" params={{ id: inv.id }} className="text-brand font-semibold hover:underline">View</Link>
                      <button className="text-muted-foreground hover:text-foreground">Assign</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
