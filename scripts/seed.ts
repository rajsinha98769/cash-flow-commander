/**
 * Seed the collectflow database with app users and (optionally) sample data.
 *
 *   bun run scripts/seed.ts            # users + indexes, sample data only if empty
 *   bun run scripts/seed.ts --force    # also (re)insert sample clients/invoices
 *
 * Users created: admin / admin123 (manager),  viewer / viewer123 (viewer)
 */
import { MongoClient, ObjectId } from "mongodb";
import { hashPassword } from "../src/lib/server/password.ts";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "collectflow";
const force = process.argv.includes("--force");

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date().toISOString();

  // Indexes
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("invoices").createIndex({ clientId: 1 });
  await db.collection("payments").createIndex({ clientId: 1 });
  await db.collection("payments").createIndex({ "allocations.invoiceId": 1 });
  await db.collection("sessions").createIndex({ expiresAt: 1 });

  // Users (upsert)
  const users = [
    { username: "admin", name: "Admin User", role: "manager", password: "admin123" },
    { username: "viewer", name: "View Only", role: "viewer", password: "viewer123" },
  ];
  for (const u of users) {
    await db.collection("users").updateOne(
      { username: u.username },
      {
        $set: { username: u.username, name: u.name, role: u.role, passwordHash: hashPassword(u.password) },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
    console.log(`user ready: ${u.username} / ${u.password} (${u.role})`);
  }

  const existingClients = await db.collection("clients").countDocuments();
  if (existingClients > 0 && !force) {
    console.log(`clients already present (${existingClients}); skipping sample data. Use --force to add sample data.`);
    await client.close();
    return;
  }

  // Sample clients
  const c1 = new ObjectId();
  const c2 = new ObjectId();
  const c3 = new ObjectId();
  await db.collection("clients").insertMany([
    { _id: c1, name: "Horizon Logistics Ltd", region: "West", gstin: "27AAACH0123L1Z2", contact: "Ramesh Iyer", email: "accounts@horizonlog.com", phone: "+91 98200 12345", creditLimit: 500000, enabled: true, notes: "", createdAt: now, updatedAt: now },
    { _id: c2, name: "Veritas Medical Systems", region: "South", gstin: "29AAECV5567K1ZA", contact: "Anita George", email: "ap@veritasmed.io", phone: "+91 98450 55221", creditLimit: 750000, enabled: true, notes: "", createdAt: now, updatedAt: now },
    { _id: c3, name: "CloudScale Engineering", region: "North", gstin: "07AAJCS4432M2Z6", contact: "Vikram Sethi", email: "finance@cloudscale.dev", phone: "+91 98110 33902", creditLimit: 300000, enabled: true, notes: "", createdAt: now, updatedAt: now },
  ]);

  // Sample invoices (one partial-paid, one overdue, one proforma)
  const i1 = new ObjectId();
  const i2 = new ObjectId();
  const i3 = new ObjectId();
  await db.collection("invoices").insertMany([
    { _id: i1, clientId: c1.toString(), number: "INV-9021", isProforma: false, invoiceDate: daysAgo(64), dueDate: daysAgo(49), amount: 254000, notes: "", writtenOff: false, createdAt: now, updatedAt: now },
    { _id: i2, clientId: c1.toString(), number: "INV-9042", isProforma: false, invoiceDate: daysAgo(20), dueDate: daysAgo(5), amount: 198000, notes: "", writtenOff: false, createdAt: now, updatedAt: now },
    { _id: i3, clientId: c2.toString(), number: "PRO-0007", isProforma: true, invoiceDate: daysAgo(3), dueDate: daysAgo(-12), amount: 128500, notes: "Proforma pending PO", writtenOff: false, createdAt: now, updatedAt: now },
  ]);

  // Sample payment — partial settlement against INV-9021
  await db.collection("payments").insertOne({
    clientId: c1.toString(),
    paymentDate: daysAgo(10),
    amount: 100000,
    mode: "NEFT",
    reference: "NEFT-445120",
    bank: "HDFC",
    notes: "Part payment",
    allocations: [{ invoiceId: i1.toString(), amount: 100000 }],
    createdAt: now,
  });

  console.log("sample data inserted: 3 clients, 3 invoices, 1 payment");
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
