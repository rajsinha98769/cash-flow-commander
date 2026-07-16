import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell, StatusPill, statusTone, useMe } from "@/components/app-shell";
import { Modal, Field, inputCls, textareaCls } from "@/components/modal";
import { InvoiceForm } from "@/components/invoice-form";
import { PaymentForm } from "@/components/payment-form";
import { getInvoiceDetail, writeOffInvoice, convertProforma } from "@/lib/api/invoices";
import { fmt } from "@/lib/derive";
import {
  BanknoteArrowUp,
  Pencil,
  FileWarning,
  FileCheck2,
  Paperclip,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice Detail — CollectFlow" }] }),
  component: InvoiceDetail,
});

function InvoiceDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: user } = useMe();
  const canEdit = user?.role === "manager";
  const { data, isLoading } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => getInvoiceDetail({ data: { id } }),
  });

  const [edit, setEdit] = useState(false);
  const [pay, setPay] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [woAmount, setWoAmount] = useState("");
  const [newNumber, setNewNumber] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["invoice", id] });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };
  const woMut = useMutation({
    mutationFn: () => writeOffInvoice({ data: { id, reason, amount: woAmount ? Number(woAmount) : undefined } }),
    onSuccess: () => {
      invalidate();
      setWriteOffOpen(false);
    },
  });
  const convMut = useMutation({
    mutationFn: () => convertProforma({ data: { id, number: newNumber } }),
    onSuccess: () => {
      invalidate();
      setConvertOpen(false);
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Invoice">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell title="Invoice not found">
        <Link to="/clients" className="text-brand text-sm font-semibold">
          Back to clients
        </Link>
      </AppShell>
    );
  }

  const { invoice: inv, client, payments } = data;

  return (
    <AppShell
      title={`${inv.isProforma ? "Proforma" : "Invoice"} ${inv.number || "(no number)"}`}
      subtitle={
        client ? (
          <>
            <Link to="/clients/$id" params={{ id: client.id }} className="text-brand hover:underline">
              {client.name}
            </Link>{" "}
            · Issued {inv.invoiceDate || "—"} · Due {inv.dueDate || "—"}
          </>
        ) : (
          "—"
        )
      }
      actions={
        canEdit ? (
          <>
            <button onClick={() => setEdit(true)} className="h-9 px-3 rounded-lg border border-primary/10 bg-card text-xs font-semibold hover:bg-muted inline-flex items-center gap-1.5">
              <Pencil className="size-3.5" /> Edit
            </button>
            {inv.balance > 0 && !inv.writtenOff ? (
              <button onClick={() => setPay(true)} className="h-9 px-3 rounded-lg bg-brand text-brand-foreground text-xs font-semibold hover:bg-brand/90 inline-flex items-center gap-1.5">
                <BanknoteArrowUp className="size-3.5" /> Record Payment
              </button>
            ) : null}
          </>
        ) : null
      }
    >
      {client ? (
        <Link to="/clients/$id" params={{ id: client.id }} className="text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="size-3.5" /> Back to {client.name}
        </Link>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Amount" value={fmt(inv.amount, 2)} />
        <Stat label="Paid" value={fmt(inv.paid, 2)} tone="text-success" />
        <Stat label="Balance" value={fmt(inv.balance, 2)} tone={inv.balance > 0 ? "text-danger" : undefined} />
        <div className="panel p-4 flex flex-col justify-center gap-1">
          <div className="label-kicker text-[9px]">Status</div>
          <div className="flex items-center gap-1.5">
            <StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill>
            {inv.isProforma ? <StatusPill tone="warning">proforma</StatusPill> : null}
          </div>
        </div>
      </div>

      {inv.writtenOff ? (
        <div className="panel p-4 mb-6 border-warning/30 bg-warning/5">
          <div className="text-sm font-semibold text-warning">Written off — {fmt(inv.writeOffAmount ?? 0, 2)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {inv.writeOffDate} · {inv.writeOffReason}
          </div>
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="panel overflow-hidden">
            <div className="px-4 py-3 border-b border-primary/5 font-semibold text-sm">Payment history</div>
            {payments.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No payments allocated to this invoice.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Mode</th>
                    <th className="p-3 text-left">Reference</th>
                    <th className="p-3 text-right">Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const alloc = p.allocations.filter((a) => a.invoiceId === id).reduce((s, a) => s + a.amount, 0);
                    return (
                      <tr key={p.id} className="border-b border-primary/5">
                        <td className="p-3 text-xs">{p.paymentDate}</td>
                        <td className="p-3">{p.mode}</td>
                        <td className="p-3 text-xs text-muted-foreground">{p.reference || "—"}</td>
                        <td className="p-3 text-right tabular-nums text-success">{fmt(alloc, 2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {inv.notes ? (
            <section className="panel p-4">
              <div className="font-semibold text-sm mb-1">Notes</div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{inv.notes}</div>
            </section>
          ) : null}
        </div>

        <div className="space-y-4">
          <section className="panel p-4">
            <div className="font-semibold text-sm mb-3">Document</div>
            {inv.fileName ? (
              <a
                href={`/files/${inv.filePath}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 hover:border-brand/30"
              >
                <div className="size-9 rounded-lg bg-muted grid place-items-center">
                  <Paperclip className="size-4" />
                </div>
                <div className="text-sm font-medium truncate">{inv.fileName}</div>
              </a>
            ) : (
              <div className="text-sm text-muted-foreground">No file attached.</div>
            )}
          </section>

          {canEdit ? (
            <section className="panel p-4 space-y-2">
              <div className="font-semibold text-sm mb-1">Actions</div>
              {inv.isProforma && inv.balance <= 0.005 ? (
                <button onClick={() => setConvertOpen(true)} className="w-full h-9 rounded-lg bg-brand/10 text-brand text-sm font-semibold hover:bg-brand/20 inline-flex items-center justify-center gap-1.5">
                  <FileCheck2 className="size-4" /> Generate Invoice
                </button>
              ) : null}
              {inv.balance > 0 && !inv.writtenOff ? (
                <button onClick={() => setWriteOffOpen(true)} className="w-full h-9 rounded-lg bg-warning/10 text-warning text-sm font-semibold hover:bg-warning/20 inline-flex items-center justify-center gap-1.5">
                  <FileWarning className="size-4" /> Write off
                </button>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      {/* Modals */}
      {edit ? <InvoiceForm clientId={inv.clientId} invoice={inv} open onClose={() => setEdit(false)} /> : null}
      {pay ? <PaymentForm clientId={inv.clientId} invoices={[inv]} preselectInvoiceId={inv.id} open onClose={() => setPay(false)} /> : null}

      <Modal open={writeOffOpen} onClose={() => setWriteOffOpen(false)} title="Write off" subtitle={`${inv.number} · balance ${fmt(inv.balance, 2)}`}>
        <form onSubmit={(e) => { e.preventDefault(); woMut.mutate(); }} className="space-y-4">
          <Field label="Write-off amount (₹)" hint={`Blank = full balance ${fmt(inv.balance, 2)}`}>
            <input type="number" min={0} step="0.01" max={inv.balance} value={woAmount} onChange={(e) => setWoAmount(e.target.value)} placeholder={String(inv.balance)} className={inputCls} />
          </Field>
          <Field label="Reason *">
            <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className={textareaCls} />
          </Field>
          {woMut.isError ? <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{(woMut.error as Error).message}</div> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setWriteOffOpen(false)} className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted">Cancel</button>
            <button type="submit" disabled={woMut.isPending} className="h-9 px-4 rounded-lg bg-warning text-white text-sm font-semibold hover:bg-warning/90 disabled:opacity-60">Confirm write-off</button>
          </div>
        </form>
      </Modal>

      <Modal open={convertOpen} onClose={() => setConvertOpen(false)} title="Generate Invoice from Proforma" subtitle={`Proforma ${inv.number} · settled ${fmt(inv.paid, 2)}`}>
        <form onSubmit={(e) => { e.preventDefault(); convMut.mutate(); }} className="space-y-4">
          <div className="text-sm text-muted-foreground">Assign a tax-invoice number to convert this settled proforma into a proper invoice.</div>
          <Field label="New invoice number *">
            <input required value={newNumber} onChange={(e) => setNewNumber(e.target.value)} placeholder="INV-0001" className={inputCls} />
          </Field>
          {convMut.isError ? <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{(convMut.error as Error).message}</div> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setConvertOpen(false)} className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted">Cancel</button>
            <button type="submit" disabled={convMut.isPending} className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 disabled:opacity-60">Generate invoice</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="panel p-4">
      <div className="label-kicker text-[9px] mb-1">{label}</div>
      <div className={`text-lg font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
