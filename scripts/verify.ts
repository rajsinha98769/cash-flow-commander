/**
 * Integration check against a live MongoDB. Exercises the same reads/writes the
 * server functions perform and asserts the derived money math. Cleans up after
 * itself. Run:  node scripts/verify.ts
 */
import { MongoClient, ObjectId } from "mongodb";
import {
  toInvoiceView,
  summarizeClient,
  buildLedger,
  unallocated,
  round2,
} from "../src/lib/derive.ts";
import type { Invoice, Payment } from "../src/lib/types.ts";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "collectflow";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`, detail ?? "");
  }
}
function isoDaysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();
  const MARK = "__verify__";

  // clean any prior run
  const prior = await db.collection("clients").find({ notes: MARK }).toArray();
  for (const c of prior) {
    await db.collection("invoices").deleteMany({ clientId: c._id.toString() });
    await db.collection("payments").deleteMany({ clientId: c._id.toString() });
  }
  await db.collection("clients").deleteMany({ notes: MARK });

  // 1) create client
  const cid = new ObjectId();
  await db.collection("clients").insertOne({
    _id: cid,
    name: "Verify Co",
    region: "Test",
    gstin: "",
    contact: "",
    email: "",
    phone: "",
    creditLimit: 100000,
    enabled: true,
    notes: MARK,
    createdAt: now,
    updatedAt: now,
  });
  const clientId = cid.toString();

  // 2) invoice (overdue) + proforma
  const invId = new ObjectId();
  const proId = new ObjectId();
  await db.collection("invoices").insertMany([
    { _id: invId, clientId, number: "V-INV-1", isProforma: false, invoiceDate: isoDaysAgo(40), dueDate: isoDaysAgo(25), amount: 1000, notes: "", writtenOff: false, createdAt: now, updatedAt: now },
    { _id: proId, clientId, number: "V-PRO-1", isProforma: true, invoiceDate: isoDaysAgo(5), dueDate: isoDaysAgo(-10), amount: 500, notes: "", writtenOff: false, createdAt: now, updatedAt: now },
  ]);

  const loadInv = async (): Promise<Invoice[]> =>
    (await db.collection("invoices").find({ clientId }).toArray()).map((d) => {
      const { _id, ...r } = d as Record<string, unknown> & { _id: ObjectId };
      return { id: _id.toString(), ...(r as object) } as Invoice;
    });
  const loadPay = async (): Promise<Payment[]> =>
    (await db.collection("payments").find({ clientId }).toArray()).map((d) => {
      const { _id, ...r } = d as Record<string, unknown> & { _id: ObjectId };
      return { id: _id.toString(), ...(r as object) } as Payment;
    });

  {
    const invoices = await loadInv();
    const payments = await loadPay();
    const inv = toInvoiceView(invoices.find((i) => i.id === invId.toString())!, payments);
    check("fresh invoice status is overdue", inv.status === "overdue", inv.status);
    check("fresh invoice balance = amount", inv.balance === 1000, inv.balance);
    const s = summarizeClient(invoices, payments);
    check("outstanding = 1500 (invoice + proforma)", s.outstanding === 1500, s.outstanding);
    check("overdue = 1000 (proforma excluded)", s.overdue === 1000, s.overdue);
  }

  // 3) partial payment 600: allocate 400 to invoice, keep 200 advance
  await db.collection("payments").insertOne({
    clientId,
    paymentDate: isoDaysAgo(2),
    amount: 600,
    mode: "NEFT",
    reference: "V-1",
    bank: "",
    notes: "",
    allocations: [{ invoiceId: invId.toString(), amount: 400 }],
    createdAt: now,
  });

  {
    const invoices = await loadInv();
    const payments = await loadPay();
    const inv = toInvoiceView(invoices.find((i) => i.id === invId.toString())!, payments);
    check("after partial: paid = 400", inv.paid === 400, inv.paid);
    check("after partial: balance = 600", inv.balance === 600, inv.balance);
    check("after partial: status = partial", inv.status === "partial", inv.status);
    check("advance (unallocated) = 200", unallocated(payments[0]) === 200, unallocated(payments[0]));
    const s = summarizeClient(invoices, payments);
    check("collected = 400", s.collected === 400, s.collected);
    check("advance on account = 200", s.advance === 200, s.advance);
    check("outstanding = 1100", s.outstanding === 1100, s.outstanding);
    const ledger = buildLedger(invoices, payments);
    const closing = ledger[ledger.length - 1].balance;
    check("ledger closing balance = 900 (debits 1500 - credits 600)", closing === 900, closing);
  }

  // 4) settle the proforma fully (500), then convert to invoice
  await db.collection("payments").insertOne({
    clientId,
    paymentDate: isoDaysAgo(1),
    amount: 500,
    mode: "UPI",
    reference: "V-2",
    bank: "",
    notes: "",
    allocations: [{ invoiceId: proId.toString(), amount: 500 }],
    createdAt: now,
  });
  {
    const invoices = await loadInv();
    const payments = await loadPay();
    const pro = toInvoiceView(invoices.find((i) => i.id === proId.toString())!, payments);
    check("proforma fully paid: balance 0", pro.balance === 0, pro.balance);
    check("proforma eligible to convert (paid & isProforma)", pro.isProforma && pro.balance <= 0.005);
  }
  await db.collection("invoices").updateOne(
    { _id: proId },
    { $set: { isProforma: false, proformaNumber: "V-PRO-1", number: "V-INV-2", updatedAt: now } },
  );
  {
    const invoices = await loadInv();
    const conv = invoices.find((i) => i.id === proId.toString())!;
    check("converted: isProforma false", conv.isProforma === false);
    check("converted: number = V-INV-2", conv.number === "V-INV-2", conv.number);
    check("converted: keeps proformaNumber", conv.proformaNumber === "V-PRO-1", conv.proformaNumber);
  }

  // 5) write off remaining balance of invoice 1
  await db.collection("invoices").updateOne(
    { _id: invId },
    { $set: { writtenOff: true, writeOffAmount: 600, writeOffReason: "test", writeOffDate: isoDaysAgo(0), updatedAt: now } },
  );
  {
    const invoices = await loadInv();
    const payments = await loadPay();
    const inv = toInvoiceView(invoices.find((i) => i.id === invId.toString())!, payments);
    check("written-off: status written-off", inv.status === "written-off", inv.status);
    check("written-off: balance 0", inv.balance === 0, inv.balance);
    const s = summarizeClient(invoices, payments);
    check("writtenOff total = 600", s.writtenOff === 600, s.writtenOff);
    // invoice1 balance 0 (written off), invoice2 (ex-proforma) balance 0 → outstanding 0
    check("outstanding now 0", round2(s.outstanding) === 0, s.outstanding);
  }

  // cleanup
  await db.collection("invoices").deleteMany({ clientId });
  await db.collection("payments").deleteMany({ clientId });
  await db.collection("clients").deleteOne({ _id: cid });

  console.log(`\n${passed} passed, ${failed} failed`);
  await client.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
