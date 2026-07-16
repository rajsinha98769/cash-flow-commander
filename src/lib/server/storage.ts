// Pluggable file storage. The app saves uploaded invoice/proforma/proof files
// through this interface and persists only the returned relative path in Mongo.
// Today the only backend is local disk; an S3/IBM COS adapter can implement the
// same interface later and be selected via STORAGE_DRIVER without touching callers.
import { promises as fs } from "node:fs";
import path from "node:path";
import { CloudinaryStorage } from "./storage-cloudinary";

export interface StoredFile {
  /** Path stored in the DB, relative to the storage root, POSIX-style. */
  path: string;
  name: string;
  size: number;
}

export interface Storage {
  save(input: {
    clientId: string;
    originalName: string;
    data: Uint8Array;
    date?: string; // yyyy-mm-dd; defaults to today
  }): Promise<StoredFile>;
  read(relPath: string): Promise<{ data: Buffer; name: string }>;
}

const ROOT = process.env.FILES_DIR
  ? path.resolve(process.env.FILES_DIR)
  : path.resolve(process.cwd(), "files");

function sanitize(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 120) || "file";
}

/** Resolve a stored relative path to an absolute path, refusing traversal. */
function resolveWithinRoot(relPath: string): string {
  const abs = path.resolve(ROOT, relPath);
  const rel = path.relative(ROOT, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error("Invalid file path");
  }
  return abs;
}

class LocalDiskStorage implements Storage {
  async save({ clientId, originalName, data, date }: Parameters<Storage["save"]>[0]) {
    const day = date ?? new Date().toISOString().slice(0, 10);
    const safeClient = sanitize(clientId);
    const dir = path.join(ROOT, safeClient, day);
    await fs.mkdir(dir, { recursive: true });

    let name = sanitize(originalName);
    // Avoid clobbering an existing file with the same name.
    let target = path.join(dir, name);
    if (await exists(target)) {
      const ext = path.extname(name);
      const stem = name.slice(0, name.length - ext.length);
      name = `${stem}-${Date.now()}${ext}`;
      target = path.join(dir, name);
    }

    await fs.writeFile(target, data);
    const rel = path.relative(ROOT, target).split(path.sep).join("/");
    return { path: rel, name, size: data.byteLength };
  }

  async read(relPath: string) {
    const abs = resolveWithinRoot(relPath);
    const data = await fs.readFile(abs);
    return { data, name: path.basename(abs) };
  }
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

let instance: Storage | undefined;

export function getStorage(): Storage {
  if (!instance) {
    if ((process.env.STORAGE_DRIVER ?? "local").toLowerCase() === "cloudinary") {
      instance = new CloudinaryStorage();
    } else {
      instance = new LocalDiskStorage();
    }
  }
  return instance;
}

export function contentTypeFor(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    csv: "text/csv",
    txt: "text/plain",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext] ?? "application/octet-stream";
}
