// Cloudinary-backed implementation of the Storage interface.
// Selected at runtime via STORAGE_DRIVER=cloudinary (see getStorage in storage.ts);
// otherwise LocalDiskStorage is used. Callers (maybeSaveFile, files.$.ts) are
// unaware of which backend is active — they only see the shared Storage contract.
//
// This talks to Cloudinary's REST API with fetch + Web Crypto (SHA-1 signing)
// rather than the Node `cloudinary` SDK: the server is bundled for the Cloudflare
// Workers runtime (nitro preset cloudflare-module), which cannot load the SDK's
// Node-only transitive deps. fetch, FormData, Blob and crypto.subtle are all
// available both on Workers and in the Node dev server.
//
// Files upload as resource_type "raw" so every document type (PDF, image, docx,
// xlsx, csv, …) round-trips byte-for-byte and keeps its extension. Delivery uses
// the default public "upload" type, but the public_id carries a random suffix
// (unique_filename) so the URL is effectively unguessable, and downloads are only
// ever served through the login-gated /files route (which fetches bytes here).
import type { Storage, StoredFile } from "./storage";

function creds(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary storage selected (STORAGE_DRIVER=cloudinary) but CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are not all set.",
    );
  }
  return { cloudName, apiKey, apiSecret };
}

// Duplicated (not imported) from storage.ts to avoid a runtime import cycle:
// storage.ts imports this class, so this module imports only types from it.
function sanitize(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 120) || "file";
}

async function sha1Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cloudinary signed-upload signature: SHA-1 of the alphabetically sorted
 *  params (excluding file/api_key/resource_type/cloud_name) plus the api_secret. */
async function sign(params: Record<string, string>, apiSecret: string): Promise<string> {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return sha1Hex(toSign + apiSecret);
}

interface UploadResponse {
  public_id: string;
  resource_type: string;
  bytes?: number;
}

export class CloudinaryStorage implements Storage {
  async save({
    clientId,
    originalName,
    data,
    date,
  }: Parameters<Storage["save"]>[0]): Promise<StoredFile> {
    const { cloudName, apiKey, apiSecret } = creds();
    const day = date ?? new Date().toISOString().slice(0, 10);
    const folder = `collectflow/${sanitize(clientId)}/${day}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // These params are both sent and signed (alphabetical order handled in sign()).
    const signed = { folder, timestamp, unique_filename: "true", use_filename: "true" };
    const signature = await sign(signed, apiSecret);

    const form = new FormData();
    form.append("file", new Blob([data as BlobPart]), sanitize(originalName));
    form.append("api_key", apiKey);
    form.append("signature", signature);
    for (const [k, v] of Object.entries(signed)) form.append(k, v);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Cloudinary upload failed: ${res.status} ${await res.text()}`);
    }
    const result = (await res.json()) as UploadResponse;

    // path encodes the resource_type so read() can reconstruct the delivery URL.
    // It stays a clean slash-path so it round-trips through the /files/$ splat route.
    return {
      path: `${result.resource_type}/${result.public_id}`,
      name: sanitize(originalName),
      size: result.bytes ?? data.byteLength,
    };
  }

  async read(relPath: string): Promise<{ data: Buffer; name: string }> {
    const { cloudName } = creds();
    const slash = relPath.indexOf("/");
    if (slash <= 0) throw new Error("Invalid Cloudinary path");
    const resourceType = relPath.slice(0, slash);
    const publicId = relPath.slice(slash + 1);

    const url = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${publicId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Cloudinary fetch failed: ${res.status}`);
    const data = Buffer.from(await res.arrayBuffer());
    const name = publicId.split("/").pop() ?? "file";
    return { data, name };
  }
}
