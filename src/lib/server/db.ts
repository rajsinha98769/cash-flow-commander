// Server-only MongoDB access. Never import this from client components — it is
// only referenced inside server-function handlers, which the bundler strips
// from the client build.
import { MongoClient, ObjectId, type Db, type Collection, type Document } from "mongodb";

// IMPORTANT: read env inside functions, NOT at module top level. On Cloudflare
// Workers, secrets are only bridged onto process.env per-request (inside the
// fetch handler) — at module-init time they are undefined. Reading them here at
// the top level would permanently bake in the localhost fallback.
function mongoUri(): string {
  return process.env.MONGODB_URI ?? "mongodb://localhost:27017";
}
function mongoDbName(): string {
  return process.env.MONGODB_DB ?? "collectflow";
}

// Reuse a single client across hot reloads / server-fn invocations.
const globalForMongo = globalThis as unknown as {
  __mongoClient?: MongoClient;
  __mongoConnect?: Promise<MongoClient>;
};

function client(): Promise<MongoClient> {
  if (!globalForMongo.__mongoConnect) {
    // Workers is a stateless, per-request runtime: keep the pool tiny and fail
    // server selection fast so errors surface instead of hanging past the limit.
    const c =
      globalForMongo.__mongoClient ??
      new MongoClient(mongoUri(), {
        maxPoolSize: 1,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
      });
    globalForMongo.__mongoClient = c;
    globalForMongo.__mongoConnect = c.connect().catch((e) => {
      // Surface the real cause in `wrangler tail` — h3 otherwise swallows it.
      console.error("[db] Mongo connect failed:", e instanceof Error ? (e.stack ?? e.message) : e);
      globalForMongo.__mongoConnect = undefined;
      globalForMongo.__mongoClient = undefined;
      throw e;
    });
  }
  return globalForMongo.__mongoConnect;
}

export async function getDb(): Promise<Db> {
  return (await client()).db(mongoDbName());
}

export type MongoDoc<T> = Omit<T, "id"> & { _id: ObjectId };

export async function collection<T extends { id: string }>(
  name: string,
): Promise<Collection<MongoDoc<T> & Document>> {
  const db = await getDb();
  return db.collection<MongoDoc<T> & Document>(name);
}

export const COLLECTIONS = {
  clients: "clients",
  invoices: "invoices",
  payments: "payments",
  users: "users",
  sessions: "sessions",
} as const;

/** Map a Mongo document to a domain object: _id -> id (hex string). */
export function serialize<T extends { id: string }>(doc: MongoDoc<T> | null): T | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as MongoDoc<T>;
  return { id: _id.toString(), ...(rest as unknown as Omit<T, "id">) } as T;
}

export function serializeMany<T extends { id: string }>(docs: MongoDoc<T>[]): T[] {
  return docs.map((d) => serialize<T>(d)!);
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

export { ObjectId };
