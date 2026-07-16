import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { collection, serialize, serializeMany, toObjectId, COLLECTIONS } from "../server/db";
import { requireUser, requireManager } from "../server/auth";
import { getStorage } from "../server/storage";
import { round2 } from "../derive";
import type { Client, Payment, PaymentAllocation } from "../types";

const allocationSchema = z.array(
  z.object({ invoiceId: z.string(), amount: z.coerce.number().min(0) }),
);

export const recordPayment = createServerFn({ method: "POST" })
  .validator((d: FormData) => {
    if (!(d instanceof FormData)) throw new Error("Expected form data");
    return d;
  })
  .handler(async ({ data: form }): Promise<Payment> => {
    await requireManager();
    const clientId = String(form.get("clientId") ?? "").trim();
    if (!clientId) throw new Error("clientId is required");
    const amount = Number(form.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be positive");

    let allocations: PaymentAllocation[] = [];
    const raw = form.get("allocations");
    if (typeof raw === "string" && raw.trim()) {
      allocations = allocationSchema
        .parse(JSON.parse(raw))
        .filter((a) => a.amount > 0)
        .map((a) => ({ invoiceId: a.invoiceId, amount: round2(a.amount) }));
    }
    const allocated = allocations.reduce((s, a) => s + a.amount, 0);
    if (allocated - amount > 0.01) {
      throw new Error("Allocated amount exceeds the payment amount");
    }

    // Optional payment-proof attachment.
    let filePath: string | undefined;
    let fileName: string | undefined;
    const file = form.get("file");
    if (file && typeof file !== "string" && file.size > 0) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const saved = await getStorage().save({ clientId, originalName: file.name, data: bytes });
      filePath = saved.path;
      fileName = saved.name;
    }

    const doc = {
      clientId,
      paymentDate: String(form.get("paymentDate") ?? "").trim() || new Date().toISOString().slice(0, 10),
      amount: round2(amount),
      mode: (String(form.get("mode") ?? "Other").trim() || "Other") as Payment["mode"],
      reference: String(form.get("reference") ?? "").trim(),
      bank: String(form.get("bank") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
      allocations,
      filePath,
      fileName,
      createdAt: new Date().toISOString(),
    };
    const col = await collection<Payment>(COLLECTIONS.payments);
    const res = await col.insertOne(doc as never);
    return serialize<Payment>(await col.findOne({ _id: res.insertedId }))!;
  });

export const deletePayment = createServerFn({ method: "POST" })
  .validator((d: { id: string }) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireManager();
    const col = await collection<Payment>(COLLECTIONS.payments);
    await col.deleteOne({ _id: toObjectId(data.id) });
    return { ok: true };
  });

export interface RecentPayment extends Payment {
  clientName: string;
}

export const listRecentPayments = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecentPayment[]> => {
    await requireUser();
    const [paymentsCol, clientsCol] = await Promise.all([
      collection<Payment>(COLLECTIONS.payments),
      collection<Client>(COLLECTIONS.clients),
    ]);
    const [paymentDocs, clientDocs] = await Promise.all([
      paymentsCol.find().sort({ createdAt: -1 }).limit(15).toArray(),
      clientsCol.find().toArray(),
    ]);
    const nameById = new Map(serializeMany<Client>(clientDocs).map((c) => [c.id, c.name]));
    return serializeMany<Payment>(paymentDocs).map((p) => ({
      ...p,
      clientName: nameById.get(p.clientId) ?? "Unknown client",
    }));
  },
);
