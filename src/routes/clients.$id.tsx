import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AppShell, StatusPill, statusTone, useMe } from "@/components/app-shell";
import { Modal, Field, inputCls, textareaCls } from "@/components/modal";
import { InvoiceForm } from "@/components/invoice-form";
import { PaymentForm } from "@/components/payment-form";
import { getClientDetail } from "@/lib/api/clients";
import { convertProforma, writeOffInvoice, deleteInvoice } from "@/lib/api/invoices";
import { deletePayment } from "@/lib/api/payments";
import { fmt } from "@/lib/derive";
import type { InvoiceView } from "@/lib/types";
import {
  BanknoteArrowUp,
  Plus,
  Pencil,
  Trash2,
  FileWarning,
  FileCheck2,
  Paperclip,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/clients/$id")({
  validateSearch: (s: Record<string, unknown>): { action?: "invoice" | "payment" } =>
    s.action === "invoice" || s.action === "payment" ? { action: s.action } : {},
  head: () => ({ meta: [{ title: "Client 360 — CollectFlow" }] }),
  component: Client360,
});

const TABS = ["Invoices", "Payments", "Ledger"] as const;

function Client360() {
  const { id } = Route.useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user } = useMe();
  const canEdit = user?.role === "manager";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["client", id],
    queryFn: () => getClientDetail({ data: { id } }),
    retry: 1,
  });

  const [tab, setTab] = useState<(typeof TABS)[number]>("Invoices");
  const [invoiceForm, setInvoiceForm] = useState<{ invoice?: InvoiceView } | null>(null);
  const [paymentFor, setPaymentFor] = useState<{ preselect?: string } | null>(null);
  const [writeOff, setWriteOff] = useState<InvoiceView | null>(null);
  const [convert, setConvert] = useState<InvoiceView | null>(null);

  // Deep-link support: /clients/$id?action=invoice|payment opens the form directly
  // (used by the quick actions on the Clients list).
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  useEffect(() => {
    if (!canEdit || !search.action) return;
    if (search.action === "invoice") setInvoiceForm({});
    else if (search.action === "payment") setPaymentFor({});
    navigate({ search: {}, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.action, canEdit]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["client", id] });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const deleteInvMut = useMutation({
    mutationFn: (invId: string) => deleteInvoice({ data: { id: invId } }),
    onSuccess: invalidate,
  });
  const deletePayMut = useMutation({
    mutationFn: (payId: string) => deletePayment({ data: { id: payId } }),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <AppShell title="Client">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }
  if (isError) {
    return (
      <AppShell title="Couldn't load client">
        <div className="panel p-6 max-w-md">
          <p className="text-sm text-muted-foreground mb-3">
            {(error as Error)?.message || "Something went wrong loading this client."}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90"
            >
              Retry
            </button>
            <Link
              to="/clients"
              className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted inline-flex items-center gap-1"
            >
              <ArrowLeft className="size-4" /> Back to clients
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell title="Client not found">
        <Link to="/clients" className="text-brand text-sm font-semibold inline-flex items-center gap-1">
          <ArrowLeft className="size-4" /> Back to clients
        </Link>
      </AppShell>
    );
  }

  const { client, invoices, payments, ledger, summary } = data;

  return (
    <AppShell
      title={client.name}
      subtitle={`${client.region || "—"} · ${client.contact || "No contact"}`}
      actions={
        canEdit ? (
          <>
            <button
              onClick={() => setInvoiceForm({})}
              className="px-3 h-9 inline-flex items-center gap-1.5 rounded-lg border border-primary/10 bg-card text-sm font-semibold hover:bg-muted"
            >
              <Plus className="size-4" /> Add Entry
            </button>
            <button
              onClick={() => setPaymentFor({})}
              className="px-4 h-9 inline-flex items-center gap-1.5 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 shadow-sm"
            >
              <BanknoteArrowUp className="size-4" /> Record Payment
            </button>
          </>
        ) : null
      }
    >
      <Link
        to="/clients"
        className="text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="size-3.5" /> All clients
      </Link>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Pending (Outstanding)" value={fmt(summary.outstanding, 2)} tone={summary.outstanding > 0 ? "text-danger" : undefined} />
        <Stat label="Overdue" value={fmt(summary.overdue, 2)} tone={summary.overdue > 0 ? "text-danger" : undefined} />
        <Stat label="Received (Collected)" value={fmt(summary.collected, 2)} tone="text-success" />
        <Stat label="Advance on account" value={fmt(summary.advance, 2)} tone={summary.advance > 0 ? "text-success" : undefined} />
      </div>

      {/* Client details */}
      <div className="panel p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm">Client Details</h2>
          <div className="flex items-center gap-2">
            <StatusPill tone={client.enabled ? "success" : "neutral"}>
              {client.enabled ? "active" : "disabled"}
            </StatusPill>
            <span className="text-[11px] text-muted-foreground">
              {summary.invoiceCount} invoice{summary.invoiceCount === 1 ? "" : "s"}
              {summary.proformaCount > 0 ? ` · ${summary.proformaCount} proforma` : ""}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
          <Detail label="Contact Person" value={client.contact} />
          <Detail label="Email" value={client.email} />
          <Detail label="Phone" value={client.phone} />
          <Detail label="Region" value={client.region} />
          <Detail label="Last Payment" value={summary.lastPaymentDate ?? "—"} />
          <Detail label="Written Off" value={fmt(summary.writtenOff, 2)} />
          <Detail label="Oldest Pending" value={summary.oldestPendingDays ? `${summary.oldestPendingDays} days` : "—"} />
        </div>
        {client.notes ? (
          <div className="mt-4 pt-4 border-t border-primary/5">
            <div className="label-kicker text-[9px] mb-1">Notes</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{client.notes}</div>
          </div>
        ) : null}
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
            {t === "Invoices" ? (
              <span className="ml-1.5 text-[11px] text-muted-foreground">{invoices.length}</span>
            ) : t === "Payments" ? (
              <span className="ml-1.5 text-[11px] text-muted-foreground">{payments.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === "Invoices" &&
        (invoices.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">
            No invoices or proformas yet.
          </div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                  <th className="p-3 text-left">Number</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Due</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right">Paid</th>
                  <th className="p-3 text-right">Balance</th>
                  <th className="p-3 text-left">Status</th>
                  {canEdit ? <th className="p-3 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-primary/5 hover:bg-muted/30">
                    <td className="p-3">
                      <Link to="/invoices/$id" params={{ id: inv.id }} className="font-mono text-xs font-semibold hover:text-brand">
                        {inv.number || "(no number)"}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {inv.isProforma ? <StatusPill tone="warning">proforma</StatusPill> : null}
                        {inv.fileName ? (
                          <a
                            href={`/files/${inv.filePath}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-muted-foreground hover:text-brand inline-flex items-center gap-0.5"
                          >
                            <Paperclip className="size-3" /> file
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{inv.invoiceDate || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {inv.dueDate || "—"}
                      {inv.agingDays > 0 && inv.balance > 0 ? (
                        <span className="text-danger"> · {inv.agingDays}d</span>
                      ) : null}
                    </td>
                    <td className="p-3 text-right tabular-nums">{fmt(inv.amount, 2)}</td>
                    <td className="p-3 text-right tabular-nums text-success">{fmt(inv.paid, 2)}</td>
                    <td className="p-3 text-right tabular-nums font-semibold">{fmt(inv.balance, 2)}</td>
                    <td className="p-3">
                      <StatusPill tone={statusTone(inv.status)}>{inv.status}</StatusPill>
                    </td>
                    {canEdit ? (
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          {inv.balance > 0 && !inv.writtenOff ? (
                            <IconBtn title="Record payment" onClick={() => setPaymentFor({ preselect: inv.id })}>
                              <BanknoteArrowUp className="size-3.5" />
                            </IconBtn>
                          ) : null}
                          {inv.isProforma && inv.balance <= 0.005 ? (
                            <IconBtn title="Generate invoice from proforma" tone="brand" onClick={() => setConvert(inv)}>
                              <FileCheck2 className="size-3.5" />
                            </IconBtn>
                          ) : null}
                          <IconBtn title="Edit" onClick={() => setInvoiceForm({ invoice: inv })}>
                            <Pencil className="size-3.5" />
                          </IconBtn>
                          {!inv.writtenOff && inv.balance > 0 ? (
                            <IconBtn title="Write off" tone="warning" onClick={() => setWriteOff(inv)}>
                              <FileWarning className="size-3.5" />
                            </IconBtn>
                          ) : null}
                          <IconBtn
                            title="Delete"
                            tone="danger"
                            onClick={() => {
                              if (confirm(`Delete ${inv.number || "this entry"}? Allocations will be removed.`))
                                deleteInvMut.mutate(inv.id);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </IconBtn>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === "Payments" &&
        (payments.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">No payments recorded.</div>
        ) : (
          <div className="panel divide-y divide-primary/5">
            {payments.map((p) => {
              const allocated = p.allocations.reduce((s, a) => s + a.amount, 0);
              const advance = p.amount - allocated;
              return (
                <div key={p.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm">
                      {fmt(p.amount, 2)} via {p.mode}
                      {p.reference ? <span className="text-muted-foreground font-normal"> · {p.reference}</span> : null}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.paymentDate}
                      {p.bank ? ` · ${p.bank}` : ""} · {p.allocations.length} invoice
                      {p.allocations.length === 1 ? "" : "s"} settled
                      {advance > 0.005 ? ` · ${fmt(advance, 2)} advance` : ""}
                    </div>
                    {p.notes ? <div className="text-xs text-muted-foreground mt-1 italic">{p.notes}</div> : null}
                    {p.fileName ? (
                      <a
                        href={`/files/${p.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        <Paperclip className="size-3" /> {p.fileName}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusPill tone="success">received</StatusPill>
                    {canEdit ? (
                      <IconBtn
                        title="Delete payment"
                        tone="danger"
                        onClick={() => {
                          if (confirm("Delete this payment? Balances will be recalculated.")) deletePayMut.mutate(p.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </IconBtn>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "Ledger" &&
        (ledger.length === 0 ? (
          <div className="panel p-10 text-center text-sm text-muted-foreground">No ledger activity.</div>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider border-b border-primary/5 bg-muted/40">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((e, i) => (
                  <tr key={i} className="border-b border-primary/5 hover:bg-muted/30">
                    <td className="p-3 text-xs">{e.date}</td>
                    <td className="p-3">
                      <StatusPill tone={e.type === "Payment" ? "success" : e.type === "Write-off" ? "warning" : "brand"}>
                        {e.type}
                      </StatusPill>
                    </td>
                    <td className="p-3 text-sm">{e.description}</td>
                    <td className="p-3 text-right tabular-nums">{e.debit ? fmt(e.debit, 2) : "—"}</td>
                    <td className="p-3 text-right tabular-nums text-success">{e.credit ? fmt(e.credit, 2) : "—"}</td>
                    <td className="p-3 text-right tabular-nums font-semibold">{fmt(e.balance, 2)}</td>
                  </tr>
                ))}
                <tr className="bg-muted/40 font-semibold">
                  <td className="p-3" colSpan={5}>
                    Closing Balance (outstanding)
                  </td>
                  <td className="p-3 text-right tabular-nums">{fmt(summary.outstanding, 2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

      {/* Modals */}
      {invoiceForm ? (
        <InvoiceForm
          clientId={id}
          invoice={invoiceForm.invoice}
          open
          onClose={() => setInvoiceForm(null)}
        />
      ) : null}
      {paymentFor ? (
        <PaymentForm
          clientId={id}
          invoices={invoices}
          preselectInvoiceId={paymentFor.preselect}
          open
          onClose={() => setPaymentFor(null)}
        />
      ) : null}

      <WriteOffModal invoice={writeOff} onClose={() => setWriteOff(null)} onDone={invalidate} />
      <ConvertModal invoice={convert} onClose={() => setConvert(null)} onDone={invalidate} router={router} />
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

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="label-kicker text-[9px] mb-0.5">{label}</div>
      <div className={`text-sm ${value ? "" : "text-muted-foreground"} ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  tone?: "danger" | "warning" | "brand";
}) {
  const hover =
    tone === "danger"
      ? "hover:bg-danger/10 hover:text-danger"
      : tone === "warning"
        ? "hover:bg-warning/10 hover:text-warning"
        : tone === "brand"
          ? "hover:bg-brand/10 hover:text-brand"
          : "hover:bg-primary/5 hover:text-foreground";
  return (
    <button title={title} onClick={onClick} className={`size-7 grid place-items-center rounded-md text-muted-foreground ${hover}`}>
      {children}
    </button>
  );
}

function WriteOffModal({
  invoice,
  onClose,
  onDone,
}: {
  invoice: InvoiceView | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      writeOffInvoice({
        data: { id: invoice!.id, reason, amount: amount ? Number(amount) : undefined },
      }),
    onSuccess: () => {
      onDone();
      onClose();
      setReason("");
      setAmount("");
    },
  });

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Write off"
      subtitle={invoice ? `${invoice.number} · balance ${fmt(invoice.balance, 2)}` : ""}
    >
      {invoice ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="space-y-4"
        >
          <Field label="Write-off amount (₹)" hint={`Leave blank to write off the full balance of ${fmt(invoice.balance, 2)}.`}>
            <input
              type="number"
              min={0}
              step="0.01"
              max={invoice.balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(invoice.balance)}
              className={inputCls}
            />
          </Field>
          <Field label="Reason *">
            <textarea required value={reason} onChange={(e) => setReason(e.target.value)} className={textareaCls} />
          </Field>
          {mut.isError ? (
            <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{(mut.error as Error).message}</div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mut.isPending}
              className="h-9 px-4 rounded-lg bg-warning text-white text-sm font-semibold hover:bg-warning/90 disabled:opacity-60"
            >
              {mut.isPending ? "Writing off…" : "Confirm write-off"}
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

function ConvertModal({
  invoice,
  onClose,
  onDone,
  router,
}: {
  invoice: InvoiceView | null;
  onClose: () => void;
  onDone: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [number, setNumber] = useState("");
  const mut = useMutation({
    mutationFn: () => convertProforma({ data: { id: invoice!.id, number } }),
    onSuccess: () => {
      onDone();
      onClose();
      setNumber("");
      router.invalidate();
    },
  });

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title="Generate Invoice from Proforma"
      subtitle={invoice ? `Proforma ${invoice.number} · settled ${fmt(invoice.paid, 2)}` : ""}
    >
      {invoice ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
          className="space-y-4"
        >
          <div className="text-sm text-muted-foreground">
            This proforma is fully settled. Assign a tax-invoice number to convert it into a proper invoice. The
            settled amount ({fmt(invoice.paid, 2)}) and history are retained.
          </div>
          <Field label="New invoice number *">
            <input required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="INV-0001" className={inputCls} />
          </Field>
          {mut.isError ? (
            <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{(mut.error as Error).message}</div>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-primary/10 text-sm font-semibold hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={mut.isPending}
              className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 disabled:opacity-60"
            >
              {mut.isPending ? "Generating…" : "Generate invoice"}
            </button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
