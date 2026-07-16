import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { collection, serialize, serializeMany, toObjectId, COLLECTIONS } from "../server/db";
import { requireUser, requireManager } from "../server/auth";
import { summarizeClient, buildLedger, toInvoiceView } from "../derive";
import type {
  Client,
  Invoice,
  Payment,
  ClientWithSummary,
  InvoiceView,
  LedgerEntry,
  ClientSummary,
} from "../types";

const clientInput = z.object({
  name: z.string().trim().min(1, "Name is required"),
  region: z.string().trim().default(""),
  gstin: z.string().trim().default(""),
  contact: z.string().trim().default(""),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  creditLimit: z.coerce.number().min(0).default(0),
  notes: z.string().trim().default(""),
  enabled: z.boolean().default(true),
});

export const listClients = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClientWithSummary[]> => {
    await requireUser();
    const [clientsCol, invoicesCol, paymentsCol] = await Promise.all([
      collection<Client>(COLLECTIONS.clients),
      collection<Invoice>(COLLECTIONS.invoices),
      collection<Payment>(COLLECTIONS.payments),
    ]);
    const [clientDocs, invoiceDocs, paymentDocs] = await Promise.all([
      clientsCol.find().sort({ name: 1 }).toArray(),
      invoicesCol.find().toArray(),
      paymentsCol.find().toArray(),
    ]);

    const clients = serializeMany<Client>(clientDocs);
    const invoices = serializeMany<Invoice>(invoiceDocs);
    const payments = serializeMany<Payment>(paymentDocs);

    return clients.map((c) => {
      const inv = invoices.filter((i) => i.clientId === c.id);
      const pay = payments.filter((p) => p.clientId === c.id);
      return { ...c, summary: summarizeClient(inv, pay) };
    });
  },
);

export interface ClientDetail {
  client: Client;
  invoices: InvoiceView[];
  payments: Payment[];
  ledger: LedgerEntry[];
  summary: ClientSummary;
}

export const getClientDetail = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }): Promise<ClientDetail | null> => {
    await requireUser();
    const clientsCol = await collection<Client>(COLLECTIONS.clients);
    const doc = await clientsCol.findOne({ _id: toObjectId(data.id) });
    const client = serialize<Client>(doc);
    if (!client) return null;

    const [invoicesCol, paymentsCol] = await Promise.all([
      collection<Invoice>(COLLECTIONS.invoices),
      collection<Payment>(COLLECTIONS.payments),
    ]);
    const [invoiceDocs, paymentDocs] = await Promise.all([
      invoicesCol.find({ clientId: data.id }).toArray(),
      paymentsCol.find({ clientId: data.id }).toArray(),
    ]);
    const invoices = serializeMany<Invoice>(invoiceDocs);
    const payments = serializeMany<Payment>(paymentDocs).sort((a, b) =>
      b.paymentDate.localeCompare(a.paymentDate),
    );

    const views = invoices
      .map((i) => toInvoiceView(i, payments))
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate));

    return {
      client,
      invoices: views,
      payments,
      ledger: buildLedger(invoices, payments),
      summary: summarizeClient(invoices, payments),
    };
  });

export const createClient = createServerFn({ method: "POST" })
  .validator((d: unknown) => clientInput.parse(d))
  .handler(async ({ data }): Promise<Client> => {
    await requireManager();
    const now = new Date().toISOString();
    const col = await collection<Client>(COLLECTIONS.clients);
    const res = await col.insertOne({ ...data, createdAt: now, updatedAt: now } as never);
    const doc = await col.findOne({ _id: res.insertedId });
    return serialize<Client>(doc)!;
  });

export const updateClient = createServerFn({ method: "POST" })
  .validator((d: unknown) => clientInput.extend({ id: z.string() }).parse(d))
  .handler(async ({ data }): Promise<Client> => {
    await requireManager();
    const { id, ...fields } = data;
    const col = await collection<Client>(COLLECTIONS.clients);
    await col.updateOne(
      { _id: toObjectId(id) },
      { $set: { ...fields, updatedAt: new Date().toISOString() } },
    );
    const doc = await col.findOne({ _id: toObjectId(id) });
    return serialize<Client>(doc)!;
  });

export const setClientEnabled = createServerFn({ method: "POST" })
  .validator((d: { id: string; enabled: boolean }) =>
    z.object({ id: z.string(), enabled: z.boolean() }).parse(d),
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireManager();
    const col = await collection<Client>(COLLECTIONS.clients);
    await col.updateOne(
      { _id: toObjectId(data.id) },
      { $set: { enabled: data.enabled, updatedAt: new Date().toISOString() } },
    );
    return { ok: true };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireManager();
    const [clientsCol, invoicesCol, paymentsCol] = await Promise.all([
      collection<Client>(COLLECTIONS.clients),
      collection<Invoice>(COLLECTIONS.invoices),
      collection<Payment>(COLLECTIONS.payments),
    ]);
    await Promise.all([
      clientsCol.deleteOne({ _id: toObjectId(data.id) }),
      invoicesCol.deleteMany({ clientId: data.id }),
      paymentsCol.deleteMany({ clientId: data.id }),
    ]);
    return { ok: true };
  });
