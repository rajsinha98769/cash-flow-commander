import { createFileRoute } from "@tanstack/react-router";
import { AppShell, StatusPill } from "@/components/app-shell";
import { clients, invoices, fmt } from "@/lib/mock-data";
import { Paperclip, Info } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/payments/new")({
  head: () => ({ meta: [{ title: "Record Payment — CollectFlow" }] }),
  component: RecordPayment,
});

function RecordPayment() {
  const [amount, setAmount] = useState(20000);
  const client = clients[0];
  const clientInvoices = invoices.filter((i) => i.clientId === client.id);
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const allocated = Object.values(allocations).reduce((s, v) => s + (v || 0), 0);
  const remaining = amount - allocated;

  return (
    <AppShell title="Record Payment" subtitle="Log incoming payment and allocate it across invoices or hold as advance.">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 panel p-6">
          <h2 className="font-bold mb-6">Payment Details</h2>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Client">
              <select className="input">
                {clients.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Invoice (optional)">
              <select className="input">
                <option>— No specific invoice —</option>
                {clientInvoices.map((i) => (
                  <option key={i.id}>{i.number} — {fmt(i.amount - i.paid, 2)} due</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Date">
              <input type="date" className="input" defaultValue="2026-07-16" />
            </Field>
            <Field label="Payment Mode">
              <select className="input">
                <option>RTGS</option>
                <option>IMPS</option>
                <option>NEFT</option>
                <option>UPI</option>
                <option>Cheque</option>
                <option>Cash</option>
              </select>
            </Field>
            <Field label="Amount Received">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="input pl-7 tabular-nums font-semibold"
                />
              </div>
            </Field>
            <Field label="Reference Number">
              <input className="input" placeholder="IMPS/RTGS ref…" defaultValue="#445120" />
            </Field>
            <Field label="Bank">
              <select className="input">
                <option>HDFC Bank — 0091</option>
                <option>ICICI Bank — 4471</option>
              </select>
            </Field>
            <Field label="Collector">
              <select className="input">
                <option>Sarah Jenkins</option>
                <option>Mike Ross</option>
              </select>
            </Field>
            <Field label="Remarks" full>
              <textarea rows={2} className="input resize-none" placeholder="Optional notes…" />
            </Field>
            <Field label="Attachment" full>
              <label className="input flex items-center gap-2 cursor-pointer text-muted-foreground text-sm">
                <Paperclip className="size-4" /> Attach payment proof (PDF, image)
                <input type="file" className="hidden" />
              </label>
            </Field>
          </div>

          <div className="mt-8 pt-6 border-t border-primary/5">
            <h3 className="font-bold mb-4">Allocation</h3>
            <div className="flex items-center gap-2 mb-4">
              {["Entire invoice", "Multiple invoices", "Client level", "Advance payment"].map((m, i) => (
                <button key={m} className={`px-3 h-8 text-xs rounded-lg font-medium transition-colors ${i === 1 ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted"}`}>
                  {m}
                </button>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5">
                  <th className="py-2 text-left">Invoice</th>
                  <th className="py-2 text-right">Balance</th>
                  <th className="py-2 text-right">Allocate</th>
                  <th className="py-2 text-right">After</th>
                </tr>
              </thead>
              <tbody>
                {clientInvoices.map((inv) => {
                  const bal = inv.amount - inv.paid;
                  const a = allocations[inv.id] || 0;
                  return (
                    <tr key={inv.id} className="border-b border-primary/5">
                      <td className="py-3 font-mono text-xs font-semibold">{inv.number}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(bal, 2)}</td>
                      <td className="py-3 text-right">
                        <input
                          type="number"
                          value={a || ""}
                          onChange={(e) => setAllocations({ ...allocations, [inv.id]: Number(e.target.value) })}
                          placeholder="0"
                          className="input w-28 text-right tabular-nums"
                        />
                      </td>
                      <td className="py-3 text-right tabular-nums font-semibold text-muted-foreground">{fmt(bal - a, 2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="panel p-6 bg-primary text-primary-foreground">
            <div className="label-kicker text-[9px] opacity-60 mb-1">Amount Received</div>
            <div className="text-3xl font-bold tabular-nums mb-6">{fmt(amount, 2)}</div>
            <div className="space-y-3 text-sm">
              <Row label="Allocated" value={fmt(allocated, 2)} />
              <Row label="Remaining" value={fmt(Math.max(remaining, 0), 2)} tone={remaining < 0 ? "danger" : "success"} />
              <Row label="Unallocated → Advance" value={fmt(Math.max(remaining, 0), 2)} muted />
            </div>
          </div>
          <div className="panel p-4 flex gap-3 items-start">
            <Info className="size-4 text-brand mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              A payment may be received without invoice allocation and adjusted later. Unallocated amount is stored as
              client advance.
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 h-10 rounded-lg border border-primary/10 bg-card text-sm font-semibold hover:bg-muted">Save Draft</button>
            <button className="flex-1 h-10 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90">Record Payment</button>
          </div>
        </div>
      </div>

      <style>{`
        .input { width: 100%; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: var(--card); padding: 0 12px; font-size: 14px; outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px color-mix(in oklab, var(--brand) 15%, transparent); }
        textarea.input { height: auto; padding: 10px 12px; }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="label-kicker text-[9px] mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, tone, muted }: { label: string; value: string; tone?: "success" | "danger"; muted?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${muted ? "opacity-60" : ""}`}>
      <span className="opacity-70">{label}</span>
      <span className={`font-mono font-semibold ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : ""}`}>
        {value}
      </span>
    </div>
  );
}
