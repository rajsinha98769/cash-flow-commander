import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { ledgerEntries, fmt } from "@/lib/mock-data";
import { Download, Printer, Mail } from "lucide-react";

export const Route = createFileRoute("/statement")({
  head: () => ({ meta: [{ title: "Client Statement — CollectFlow" }] }),
  component: Statement,
});

function Statement() {
  return (
    <AppShell
      title="Client Statement"
      subtitle="Professional account statement — ready to email or export."
      actions={
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5"><Printer className="size-3.5" /> Print</button>
          <button className="h-9 px-3 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5"><Mail className="size-3.5" /> Email</button>
          <button className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-xs font-semibold hover:bg-brand/90 inline-flex items-center gap-1.5"><Download className="size-3.5" /> Export PDF</button>
        </div>
      }
    >
      <div className="panel p-10 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-primary/10">
          <div>
            <div className="text-2xl font-bold tracking-tight mb-1">Statement of Account</div>
            <div className="text-xs text-muted-foreground">Period: 01 Apr 2026 — 14 Jul 2026</div>
          </div>
          <div className="text-right">
            <div className="size-10 bg-brand rounded-lg flex items-center justify-center text-brand-foreground font-bold ml-auto mb-2">C</div>
            <div className="text-sm font-bold">CollectFlow CA Services</div>
            <div className="text-[11px] text-muted-foreground">203 Fort Road, Mumbai 400001</div>
            <div className="text-[11px] text-muted-foreground">GSTIN: 27AAACC1234H1Z5</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <div className="label-kicker text-[9px] mb-2">Billed To</div>
            <div className="text-sm font-bold">Horizon Logistics Ltd</div>
            <div className="text-xs text-muted-foreground">Ramesh Iyer · accounts@horizonlog.com</div>
            <div className="text-xs text-muted-foreground">GSTIN: 27AAACH0123L1Z2</div>
          </div>
          <div>
            <div className="label-kicker text-[9px] mb-2">Summary</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Opening Balance</span><span className="font-mono">{fmt(24_800, 2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Debits</span><span className="font-mono">{fmt(67_600, 2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Credits</span><span className="font-mono text-success">{fmt(25_000, 2)}</span></div>
              <div className="flex justify-between pt-2 mt-2 border-t border-primary/10 font-bold">
                <span>Closing Balance</span><span className="font-mono">{fmt(67_400, 2)}</span>
              </div>
            </div>
          </div>
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b-2 border-primary/10">
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Type</th>
              <th className="py-2 text-left">Description</th>
              <th className="py-2 text-right">Debit</th>
              <th className="py-2 text-right">Credit</th>
              <th className="py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.map((e, i) => (
              <tr key={i} className={`border-b border-primary/5 ${e.type === "Opening" || e.type === "Closing" ? "font-bold" : ""}`}>
                <td className="py-2.5 text-xs">{e.date}</td>
                <td className="py-2.5"><StatusPill tone={e.type === "Payment" ? "success" : e.type === "Invoice" ? "brand" : "neutral"}>{e.type}</StatusPill></td>
                <td className="py-2.5 text-xs">{e.description}</td>
                <td className="py-2.5 text-right tabular-nums">{e.debit ? fmt(e.debit, 2) : "—"}</td>
                <td className="py-2.5 text-right tabular-nums text-success">{e.credit ? fmt(e.credit, 2) : "—"}</td>
                <td className="py-2.5 text-right tabular-nums font-semibold">{fmt(e.balance, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pt-6 border-t border-primary/10 grid grid-cols-2 gap-6 text-xs text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground mb-1">Payment Summary</div>
            <div>Total received in period: <span className="font-mono">{fmt(25_000, 2)}</span></div>
            <div>Payment modes: IMPS (1), RTGS (0), Cheque (0)</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-foreground mb-1">Pay to</div>
            <div>HDFC Bank · A/c 00910123456 · IFSC HDFC0000091</div>
            <div>Reference: Client ID C-001 or invoice number</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
