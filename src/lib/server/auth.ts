// Server-only authentication for app users (managers/viewers). No client login.
// Passwords are scrypt-hashed; sessions are random tokens stored in Mongo and
// carried in an httpOnly cookie.
import { randomBytes } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { getDb, COLLECTIONS, serialize, type MongoDoc } from "./db";
import type { User, UserRole } from "../types";

export { hashPassword, verifyPassword } from "./password";

const COOKIE = "cf_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

interface SessionDoc {
  _id: string; // random token
  userId: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
  expiresAt: number;
}

interface UserDoc extends MongoDoc<User> {
  passwordHash: string;
}

export async function findUserByUsername(username: string): Promise<UserDoc | null> {
  const db = await getDb();
  return db.collection<UserDoc>(COLLECTIONS.users).findOne({ username: username.toLowerCase() });
}

export async function createSession(user: User): Promise<void> {
  const db = await getDb();
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  await db.collection<SessionDoc>(COLLECTIONS.sessions).insertOne({
    _id: token,
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    createdAt: new Date(now).toISOString(),
    expiresAt: now + SESSION_TTL_MS,
  });
  setCookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function getSessionUser(): Promise<User | null> {
  const token = getCookie(COOKIE);
  if (!token) return null;
  const db = await getDb();
  const session = await db
    .collection<SessionDoc>(COLLECTIONS.sessions)
    .findOne({ _id: token });
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    await db.collection<SessionDoc>(COLLECTIONS.sessions).deleteOne({ _id: token });
    return null;
  }
  const doc = await db
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ _id: new (await import("mongodb")).ObjectId(session.userId) });
  if (!doc) return null;
  const { passwordHash: _pw, ...clean } = doc;
  return serialize<User>(clean as MongoDoc<User>);
}

export async function destroySession(): Promise<void> {
  const token = getCookie(COOKIE);
  if (token) {
    const db = await getDb();
    await db.collection<SessionDoc>(COLLECTIONS.sessions).deleteOne({ _id: token });
  }
  deleteCookie(COOKIE, { path: "/" });
}

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new AuthError("UNAUTHENTICATED", "Please sign in.");
  return user;
}

export async function requireManager(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "manager") {
    throw new AuthError("FORBIDDEN", "Manager access required for this action.");
  }
  return user;
}
