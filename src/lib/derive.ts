// Pure derivation helpers — turn stored records into the computed views the UI
// needs (invoice balances/status, client summaries, ledgers, dashboard totals).
// No I/O here: callable from both server aggregation and client rendering.

import type {
  Invoice,
  InvoiceStatus,
  InvoiceView,
  Payment,
  ClientSummary,
  LedgerEntry,
} from "./types";

const EPS = 0.005;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string = todayISO()): number {
  const a = new Date(fromISO + "T00:00:00Z").getTime();
  const b = new Date(toISO + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Total amount allocated to a given invoice across all payments. */
export function paidForInvoice(invoiceId: string, payments: Payment[]): number {
  let sum = 0;
  for (const p of payments) {
    for (const a of p.allocations) {
      if (a.invoiceId === invoiceId) sum += a.amount;
    }
  }
  return round2(sum);
}

export function invoiceStatus(inv: Invoice, paid: number, balance: number): InvoiceStatus {
  if (inv.writtenOff) return "written-off";
  if (balance <= EPS) return "paid";
  if (paid > EPS) return "partial";
  if (inv.dueDate && daysBetween(inv.dueDate) > 0) return "overdue";
  return "pending";
}

export function toInvoiceView(inv: Invoice, payments: Payment[]): InvoiceView {
  const paid = paidForInvoice(inv.id, payments);
  const writeOff = inv.writtenOff ? inv.writeOffAmount ?? inv.amount - paid : 0;
  const balance = round2(Math.max(0, inv.amount - paid - writeOff));
  const status = invoiceStatus(inv, paid, balance);
  const agingDays = inv.dueDate ? Math.max(0, daysBetween(inv.dueDate)) : 0;
  return { ...inv, paid, balance, status, agingDays };
}

/** Sum of amounts a payment has NOT allocated to any invoice (held as advance). */
export function unallocated(p: Payment): number {
  const allocated = p.allocations.reduce((s, a) => s + a.amount, 0);
  return round2(Math.max(0, p.amount - allocated));
}

export function summarizeClient(invoices: Invoice[], payments: Payment[]): ClientSummary {
  const views = invoices.map((i) => toInvoiceView(i, payments));

  const outstanding = round2(views.reduce((s, v) => s + v.balance, 0));
  const overdue = round2(
    views
      .filter((v) => !v.isProforma && v.status === "overdue")
      .reduce((s, v) => s + v.balance, 0),
  );
  const advance = round2(payments.reduce((s, p) => s + unallocated(p), 0));
  const collected = round2(
    payments.reduce((s, p) => s + p.allocations.reduce((t, a) => t + a.amount, 0), 0),
  );
  const writtenOff = round2(
    invoices.reduce((s, i) => s + (i.writtenOff ? i.writeOffAmount ?? 0 : 0), 0),
  );

  const pending = views.filter((v) => v.balance > EPS && !v.writtenOff);
  const oldestPendingDays = pending.length
    ? Math.max(...pending.map((v) => (v.invoiceDate ? daysBetween(v.invoiceDate) : 0)))
    : 0;

  const paymentDates = payments.map((p) => p.paymentDate).filter(Boolean).sort();
  const lastPaymentDate = paymentDates.length ? paymentDates[paymentDates.length - 1] : null;

  return {
    outstanding,
    overdue,
    advance,
    collected,
    writtenOff,
    invoiceCount: invoices.filter((i) => !i.isProforma).length,
    proformaCount: invoices.filter((i) => i.isProforma).length,
    oldestPendingDays,
    lastPaymentDate,
  };
}

/** Chronological running-balance ledger for one client. */
export function buildLedger(invoices: Invoice[], payments: Payment[]): LedgerEntry[] {
  type Row = Omit<LedgerEntry, "balance">;
  const rows: Array<Row & { sort: string }> = [];

  for (const inv of invoices) {
    rows.push({
      sort: inv.invoiceDate,
      date: inv.invoiceDate,
      type: inv.isProforma ? "Proforma" : "Invoice",
      description: `${inv.isProforma ? "Proforma" : "Invoice"} ${inv.number}`,
      ref: inv.number,
      debit: inv.amount,
      credit: 0,
    });
    if (inv.writtenOff && inv.writeOffAmount) {
      rows.push({
        sort: inv.writeOffDate ?? inv.updatedAt.slice(0, 10),
        date: inv.writeOffDate ?? inv.updatedAt.slice(0, 10),
        type: "Write-off",
        description: `Write-off ${inv.number}${inv.writeOffReason ? " — " + inv.writeOffReason : ""}`,
        ref: inv.number,
        debit: 0,
        credit: inv.writeOffAmount,
      });
    }
  }

  for (const p of payments) {
    rows.push({
      sort: p.paymentDate,
      date: p.paymentDate,
      type: "Payment",
      description: `Payment via ${p.mode}${p.reference ? " · " + p.reference : ""}`,
      ref: p.reference,
      debit: 0,
      credit: p.amount,
    });
  }

  rows.sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));

  let balance = 0;
  return rows.map(({ sort: _sort, ...r }) => {
    balance = round2(balance + r.debit - r.credit);
    return { ...r, balance };
  });
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function fmt(n: number, digits = 0) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n || 0);
}

export function fmtCompact(n: number) {
  if (Math.abs(n) >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100_000) return `₹${(n / 100_000).toFixed(2)}L`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${n}`;
}
