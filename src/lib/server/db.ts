// Server-only MongoDB access. Never import this from client components — it is
// only referenced inside server-function handlers, which the bundler strips
// from the client build.
import { MongoClient, ObjectId, type Db, type Collection, type Document } from "mongodb";

const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017";
const dbName = process.env.MONGODB_DB ?? "collectflow";

// Reuse a single client across hot reloads / server-fn invocations.
const globalForMongo = globalThis as unknown as {
  __mongoClient?: MongoClient;
  __mongoConnect?: Promise<MongoClient>;
};

function client(): Promise<MongoClient> {
  if (!globalForMongo.__mongoConnect) {
    const c = globalForMongo.__mongoClient ?? new MongoClient(uri);
    globalForMongo.__mongoClient = c;
    globalForMongo.__mongoConnect = c.connect();
  }
  return globalForMongo.__mongoConnect;
}

export async function getDb(): Promise<Db> {
  return (await client()).db(dbName);
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
