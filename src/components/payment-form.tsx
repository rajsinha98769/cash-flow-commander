import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Modal, Field, inputCls, textareaCls } from "@/components/modal";
import { recordPayment } from "@/lib/api/payments";
import { fmt, round2, todayISO } from "@/lib/derive";
import type { InvoiceView, PaymentMode } from "@/lib/types";
import { Wand2 } from "lucide-react";

const MODES: PaymentMode[] = ["Cash", "UPI", "NEFT", "RTGS", "IMPS", "Cheque", "Card", "Other"];

/**
 * Record a payment and settle it against one or more of the client's open
 * invoices. Any amount left unallocated is kept on account as an advance.
 */
export function PaymentForm({
  clientId,
  invoices,
  preselectInvoiceId,
  open,
  onClose,
}: {
  clientId: string;
  invoices: InvoiceView[];
  preselectInvoiceId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const openInvoices = useMemo(
    () => invoices.filter((i) => i.balance > 0.005 && !i.writtenOff),
    [invoices],
  );

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [mode, setMode] = useState<PaymentMode>("NEFT");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [alloc, setAlloc] = useState<Record<string, string>>(() =>
    preselectInvoiceId ? { [preselectInvoiceId]: "" } : {},
  );

  const amountNum = Number(amount) || 0;
  const allocatedNum = round2(
    Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0),
  );
  const unallocated = round2(amountNum - allocatedNum);

  const setAllocFor = (id: string, val: string) => setAlloc((a) => ({ ...a, [id]: val }));

  const autoAllocate = () => {
    let remaining = amountNum;
    const next: Record<string, string> = {};
    // Oldest first (openInvoices come newest-first from the 360 view).
    for (const inv of [...openInvoices].sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate))) {
      if (remaining <= 0) break;
      const take = round2(Math.min(inv.balance, remaining));
      if (take > 0) {
        next[inv.id] = String(take);
        remaining = round2(remaining - take);
      }
    }
    setAlloc(next);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const allocations = Object.entries(alloc)
        .map(([invoiceId, v]) => ({ invoiceId, amount: Number(v) || 0 }))
        .filter((a) => a.amount > 0);
      const fd = new FormData();
      fd.set("clientId", clientId);
      fd.set("amount", String(amountNum));
      fd.set("paymentDate", paymentDate);
      fd.set("mode", mode);
      fd.set("reference", reference);
      fd.set("bank", bank);
      fd.set("notes", notes);
      fd.set("allocations", JSON.stringify(allocations));
      if (file) fd.set("file", file);
      return recordPayment({ data: fd });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    },
  });

  const overAllocated = allocatedNum - amountNum > 0.01;

  return (
    <Modal open={open} onClose={onClose} title="Record Payment" subtitle="Settle against invoices or keep as advance" width="max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Amount received (₹) *">
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputCls}
              autoFocus
            />
          </Field>
          <Field label="Payment date">
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Mode">
            <select value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)} className={inputCls}>
              {MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reference #">
            <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bank">
            <input value={bank} onChange={(e) => setBank(e.target.value)} className={inputCls} />
          </Field>
        </div>

        {/* Allocation */}
        <div className="rounded-lg border border-primary/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
            <span className="label-kicker text-[10px]">Allocate to invoices</span>
            <button
              type="button"
              onClick={autoAllocate}
              disabled={!amountNum}
              className="text-xs font-semibold text-brand inline-flex items-center gap-1 hover:underline disabled:opacity-50"
            >
              <Wand2 className="size-3" /> Auto-allocate oldest first
            </button>
          </div>
          {openInvoices.length === 0 ? (
            <div className="px-4 py-4 text-sm text-muted-foreground">
              No open invoices — the full amount will be kept as an advance.
            </div>
          ) : (
            <div className="divide-y divide-primary/5 max-h-56 overflow-y-auto">
              {openInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 px-4 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs font-semibold truncate">
                      {inv.number || "(no number)"}
                      {inv.isProforma ? <span className="ml-1 text-warning">· proforma</span> : null}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Balance {fmt(inv.balance, 2)} · due {inv.dueDate || "—"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllocFor(inv.id, String(inv.balance))}
                    className="text-[11px] text-muted-foreground hover:text-brand"
                  >
                    full
                  </button>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    max={inv.balance}
                    value={alloc[inv.id] ?? ""}
                    onChange={(e) => setAllocFor(inv.id, e.target.value)}
                    placeholder="0.00"
                    className="w-28 h-8 px-2 rounded-md border border-primary/10 bg-card text-sm text-right tabular-nums outline-none focus:border-brand"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live calculation */}
        <div className="grid grid-cols-3 gap-3">
          <Calc label="Allocated" value={allocatedNum} />
          <Calc label="Unallocated (advance)" value={unallocated} tone={unallocated > 0 ? "success" : undefined} />
          <Calc label="Payment total" value={amountNum} />
        </div>

        <Field label="Payment proof (optional)">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm file:mr-3 file:h-9 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-sm file:font-semibold"
          />
        </Field>
        <Field label="Remarks">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} />
        </Field>

        {overAllocated ? (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            Allocated amount exceeds the payment amount.
          </div>
        ) : null}
        {mutation.isError ? (
          <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {(mutation.error as Error).message}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending || overAllocated || amountNum <= 0}
            className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 disabled:opacity-60"
          >
            {mutation.isPending ? "Recording…" : "Record payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Calc({ label, value, tone }: { label: string; value: number; tone?: "success" }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="label-kicker text-[9px] mb-1">{label}</div>
      <div className={`text-base font-bold tabular-nums ${tone === "success" ? "text-success" : ""}`}>
        {fmt(value, 2)}
      </div>
    </div>
  );
}
