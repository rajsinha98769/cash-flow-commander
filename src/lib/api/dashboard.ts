import { createServerFn } from "@tanstack/react-start";
import { collection, serializeMany, COLLECTIONS } from "../server/db";
import { requireUser } from "../server/auth";
import { toInvoiceView, unallocated, round2 } from "../derive";
import type { Client, Invoice, Payment, DashboardTotals } from "../types";

export const getDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<DashboardTotals> => {
    await requireUser();
    const [clientsCol, invoicesCol, paymentsCol] = await Promise.all([
      collection<Client>(COLLECTIONS.clients),
      collection<Invoice>(COLLECTIONS.invoices),
      collection<Payment>(COLLECTIONS.payments),
    ]);
    const [clientDocs, invoiceDocs, paymentDocs] = await Promise.all([
      clientsCol.find().toArray(),
      invoicesCol.find().toArray(),
      paymentsCol.find().toArray(),
    ]);
    const clients = serializeMany<Client>(clientDocs);
    const invoices = serializeMany<Invoice>(invoiceDocs);
    const payments = serializeMany<Payment>(paymentDocs);
    const views = invoices.map((i) => toInvoiceView(i, payments));

    const totalOutstanding = round2(views.reduce((s, v) => s + v.balance, 0));
    const overdue = round2(
      views.filter((v) => !v.isProforma && v.status === "overdue").reduce((s, v) => s + v.balance, 0),
    );
    const totalReceivable = round2(
      invoices.filter((i) => !i.isProforma && !i.writtenOff).reduce((s, i) => s + i.amount, 0),
    );
    const collected = round2(
      payments.reduce((s, p) => s + p.allocations.reduce((t, a) => t + a.amount, 0), 0),
    );

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const collectedThisMonth = round2(
      payments.filter((p) => p.paymentDate.startsWith(ym)).reduce((s, p) => s + p.amount, 0),
    );

    const writtenOff = round2(
      invoices.reduce((s, i) => s + (i.writtenOff ? i.writeOffAmount ?? 0 : 0), 0),
    );
    const advance = round2(payments.reduce((s, p) => s + unallocated(p), 0));

    return {
      totalOutstanding,
      totalReceivable,
      collected,
      collectedThisMonth,
      pendingCollection: round2(Math.max(0, totalOutstanding - overdue)),
      overdue,
      writtenOff,
      advance,
      collectionRate:
        collected + totalOutstanding > 0
          ? round2((collected / (collected + totalOutstanding)) * 100)
          : 0,
      clientsWithOutstanding: clients.filter((c) => {
        const bal = views.filter((v) => v.clientId === c.id).reduce((s, v) => s + v.balance, 0);
        return bal > 0.005;
      }).length,
      overdueInvoices: views.filter((v) => v.status === "overdue").length,
      activeClients: clients.filter((c) => c.enabled).length,
    };
  },
);
