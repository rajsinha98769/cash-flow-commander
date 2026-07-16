import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { invoices, fmt } from "@/lib/mock-data";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/payments/allocate")({
  head: () => ({ meta: [{ title: "Payment Allocation — CollectFlow" }] }),
  component: Allocate,
});

function Allocate() {
  const [received] = useState(35000);
  const open = invoices.filter((i) => i.clientId === "c-004");
  const [alloc, setAlloc] = useState<Record<string, number>>({
    "i-5": 20000,
    "i-6": 15000,
  });
  const total = Object.values(alloc).reduce((s, v) => s + v, 0);
  const remaining = received - total;

  return (
    <AppShell
      title="Payment Allocation"
      subtitle="Split one payment across multiple outstanding invoices and preview the settlement."
    >
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4 panel p-6 bg-primary text-primary-foreground">
          <div className="label-kicker text-[9px] opacity-60 mb-1">Payment Received</div>
          <div className="text-3xl font-bold tabular-nums mb-6">{fmt(received, 2)}</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="opacity-70">Client</span><span className="font-semibold">Apex Holdings Pvt Ltd</span></div>
            <div className="flex justify-between"><span className="opacity-70">Reference</span><span className="font-mono">RTGS-9924</span></div>
            <div className="flex justify-between"><span className="opacity-70">Date</span><span>2026-07-16</span></div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between"><span className="opacity-70">Allocated</span><span className="font-mono font-semibold">{fmt(total, 2)}</span></div>
            <div className="flex justify-between">
              <span className="opacity-70">Remaining</span>
              <span className={`font-mono font-semibold ${remaining < 0 ? "text-danger" : "text-success"}`}>{fmt(remaining, 2)}</span>
            </div>
            <div className="h-1.5 mt-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-success" style={{ width: `${Math.min((total / received) * 100, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-8 panel overflow-hidden">
          <div className="p-6 border-b border-primary/5 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Outstanding Invoices</h2>
              <p className="text-xs text-muted-foreground">Allocate amounts against invoices in aging order</p>
            </div>
            <button className="text-xs text-brand font-semibold hover:underline">Auto-allocate (FIFO)</button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                <th className="p-4 text-left">Invoice</th>
                <th className="p-4 text-left">Aging</th>
                <th className="p-4 text-right">Balance</th>
                <th className="p-4 text-right">Allocate</th>
                <th className="p-4 text-center">→</th>
                <th className="p-4 text-right">Post-settlement</th>
              </tr>
            </thead>
            <tbody>
              {open.map((inv) => {
                const bal = inv.amount - inv.paid;
                const a = alloc[inv.id] || 0;
                return (
                  <tr key={inv.id} className="border-b border-primary/5">
                    <td className="p-4">
                      <div className="font-mono text-xs font-semibold">{inv.number}</div>
                      <div className="text-[11px] text-muted-foreground">Due {inv.dueDate}</div>
                    </td>
                    <td className="p-4">
                      <StatusPill tone={inv.agingDays > 60 ? "danger" : "warning"}>{inv.agingDays}d</StatusPill>
                    </td>
                    <td className="p-4 text-right tabular-nums font-medium">{fmt(bal, 2)}</td>
                    <td className="p-4 text-right">
                      <input
                        type="number"
                        value={a}
                        onChange={(e) => setAlloc({ ...alloc, [inv.id]: Number(e.target.value) })}
                        className="w-32 h-9 text-right tabular-nums font-semibold border border-primary/10 rounded-lg px-3 bg-card focus:border-brand outline-none"
                      />
                    </td>
                    <td className="p-4 text-center text-muted-foreground"><ArrowRight className="size-4 inline" /></td>
                    <td className="p-4 text-right tabular-nums font-semibold text-muted-foreground">{fmt(bal - a, 2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 flex justify-end gap-2 border-t border-primary/5 bg-muted/30">
            <button className="h-10 px-4 rounded-lg border border-primary/10 bg-card text-sm font-semibold hover:bg-muted">Preview</button>
            <button className="h-10 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90">Confirm Allocation</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
