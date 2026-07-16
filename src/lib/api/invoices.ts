import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { collection, serialize, serializeMany, toObjectId, COLLECTIONS } from "../server/db";
import { requireUser, requireManager } from "../server/auth";
import { getStorage } from "../server/storage";
import { toInvoiceView } from "../derive";
import type { Client, Invoice, Payment, InvoiceView } from "../types";

function str(form: FormData, key: string, fallback = ""): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : fallback;
}
function bool(form: FormData, key: string): boolean {
  const v = form.get(key);
  return v === "true" || v === "on" || v === "1";
}
function num(form: FormData, key: string): number {
  const v = Number(form.get(key));
  return Number.isFinite(v) ? v : 0;
}

async function maybeSaveFile(
  form: FormData,
  clientId: string,
): Promise<{ filePath?: string; fileName?: string }> {
  const file = form.get("file");
  if (file && typeof file !== "string" && file.size > 0) {
    const data = new Uint8Array(await file.arrayBuffer());
    const saved = await getStorage().save({ clientId, originalName: file.name, data });
    return { filePath: saved.path, fileName: saved.name };
  }
  return {};
}

export const createInvoice = createServerFn({ method: "POST" })
  .validator((d: FormData) => {
    if (!(d instanceof FormData)) throw new Error("Expected form data");
    return d;
  })
  .handler(async ({ data: form }): Promise<Invoice> => {
    await requireManager();
    const clientId = str(form, "clientId");
    if (!clientId) throw new Error("clientId is required");
    const now = new Date().toISOString();
    const file = await maybeSaveFile(form, clientId);

    const doc = {
      clientId,
      number: str(form, "number"),
      isProforma: bool(form, "isProforma"),
      invoiceDate: str(form, "invoiceDate"),
      dueDate: str(form, "dueDate"),
      amount: num(form, "amount"),
      notes: str(form, "notes"),
      writtenOff: false,
      ...file,
      createdAt: now,
      updatedAt: now,
    };
    const col = await collection<Invoice>(COLLECTIONS.invoices);
    const res = await col.insertOne(doc as never);
    return serialize<Invoice>(await col.findOne({ _id: res.insertedId }))!;
  });

export const updateInvoice = createServerFn({ method: "POST" })
  .validator((d: FormData) => {
    if (!(d instanceof FormData)) throw new Error("Expected form data");
    return d;
  })
  .handler(async ({ data: form }): Promise<Invoice> => {
    await requireManager();
    const id = str(form, "id");
    if (!id) throw new Error("id is required");
    const col = await collection<Invoice>(COLLECTIONS.invoices);
    const existing = serialize<Invoice>(await col.findOne({ _id: toObjectId(id) }));
    if (!existing) throw new Error("Invoice not found");

    const file = await maybeSaveFile(form, existing.clientId);
    const set: Partial<Invoice> = {
      number: str(form, "number"),
      isProforma: bool(form, "isProforma"),
      invoiceDate: str(form, "invoiceDate"),
      dueDate: str(form, "dueDate"),
      amount: num(form, "amount"),
      notes: str(form, "notes"),
      updatedAt: new Date().toISOString(),
      ...file,
    };
    await col.updateOne({ _id: toObjectId(id) }, { $set: set });
    return serialize<Invoice>(await col.findOne({ _id: toObjectId(id) }))!;
  });

export const deleteInvoice = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireManager();
    const col = await collection<Invoice>(COLLECTIONS.invoices);
    await col.deleteOne({ _id: toObjectId(data.id) });
    // Remove allocations pointing at this invoice.
    const payments = await collection<Payment>(COLLECTIONS.payments);
    const affected = await payments.find({ "allocations.invoiceId": data.id }).toArray();
    for (const p of affected) {
      const kept = p.allocations.filter((a) => a.invoiceId !== data.id);
      await payments.updateOne({ _id: p._id }, { $set: { allocations: kept } });
    }
    return { ok: true };
  });

/** Convert a proforma into a real invoice by assigning it an invoice number. */
export const convertProforma = createServerFn({ method: "POST" })
  .validator((d: { id: string; number: string }) =>
    z.object({ id: z.string(), number: z.string().trim().min(1, "Invoice number required") }).parse(d),
  )
  .handler(async ({ data }): Promise<Invoice> => {
    await requireManager();
    const col = await collection<Invoice>(COLLECTIONS.invoices);
    const existing = serialize<Invoice>(await col.findOne({ _id: toObjectId(data.id) }));
    if (!existing) throw new Error("Invoice not found");
    if (!existing.isProforma) throw new Error("Already an invoice");
    await col.updateOne(
      { _id: toObjectId(data.id) },
      {
        $set: {
          isProforma: false,
          proformaNumber: existing.number,
          number: data.number,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    return serialize<Invoice>(await col.findOne({ _id: toObjectId(data.id) }))!;
  });

export const writeOffInvoice = createServerFn({ method: "POST" })
  .validator((d: { id: string; reason: string; amount?: number }) =>
    z
      .object({
        id: z.string(),
        reason: z.string().trim().min(1, "Reason required"),
        amount: z.coerce.number().min(0).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<Invoice> => {
    await requireManager();
    const col = await collection<Invoice>(COLLECTIONS.invoices);
    await col.updateOne(
      { _id: toObjectId(data.id) },
      {
        $set: {
          writtenOff: true,
          writeOffReason: data.reason,
          writeOffAmount: data.amount,
          writeOffDate: new Date().toISOString().slice(0, 10),
          updatedAt: new Date().toISOString(),
        },
      },
    );
    return serialize<Invoice>(await col.findOne({ _id: toObjectId(data.id) }))!;
  });

export interface InvoiceDetail {
  invoice: InvoiceView;
  client: Client | null;
  payments: Payment[];
}

export const getInvoiceDetail = createServerFn({ method: "GET" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }): Promise<InvoiceDetail | null> => {
    await requireUser();
    const col = await collection<Invoice>(COLLECTIONS.invoices);
    const invoice = serialize<Invoice>(await col.findOne({ _id: toObjectId(data.id) }));
    if (!invoice) return null;

    const [clientsCol, paymentsCol] = await Promise.all([
      collection<Client>(COLLECTIONS.clients),
      collection<Payment>(COLLECTIONS.payments),
    ]);
    const [clientDoc, paymentDocs] = await Promise.all([
      clientsCol.findOne({ _id: toObjectId(invoice.clientId) }),
      paymentsCol.find({ "allocations.invoiceId": data.id }).toArray(),
    ]);
    const payments = serializeMany<Payment>(paymentDocs);
    return {
      invoice: toInvoiceView(invoice, payments),
      client: serialize<Client>(clientDoc),
      payments,
    };
  });
