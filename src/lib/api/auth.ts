import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  findUserByUsername,
  verifyPassword,
  createSession,
  destroySession,
  getSessionUser,
} from "../server/auth";
import { serialize, type MongoDoc } from "../server/db";
import type { User } from "../types";

export const login = createServerFn({ method: "POST" })
  .validator((d: { username: string; password: string }) =>
    z.object({ username: z.string().trim().min(1), password: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ user: User }> => {
    const doc = await findUserByUsername(data.username);
    if (!doc || !verifyPassword(data.password, doc.passwordHash)) {
      throw new Error("Invalid username or password");
    }
    const { passwordHash: _pw, ...clean } = doc;
    const user = serialize<User>(clean as MongoDoc<User>)!;
    await createSession(user);
    return { user };
  });

export const logout = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true }> => {
    await destroySession();
    return { ok: true };
  },
);

export const me = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    return getSessionUser();
  },
);
