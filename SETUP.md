# CollectFlow — A/R & Collections (MVP) — Setup

A MongoDB-backed accounts-receivable & collections module. This MVP covers:
clients (CRUD + enable/disable), invoices & proformas (upload/edit with file
attachment + proforma flag), settlements (full / partial / multi-invoice /
advance / write-off), proforma → invoice conversion, per-client 360 (invoices,
payments, running ledger), and a live collections dashboard. App-user login
(manager can edit, viewer is read-only); there is no client-facing login.

## ⚠️ Run under Node, not Bun

The `mongodb` driver's `bson` dependency uses a V8 API that Bun does not
implement (`node:v8 isBuildingSnapshot`). **Use Node 24+ (`npm run …`), not
`bun run …`, for `dev`, `seed`, and `verify`.** Dependencies can still be
installed with either `bun install` or `npm install`.

## Prerequisites

- Node.js 24+
- A running MongoDB (local default: `mongodb://localhost:27017`)

## Configure (optional)

Copy `.env.example` → `.env` if you need non-defaults:

```
MONGODB_URI=mongodb://localhost:27017   # connection string
MONGODB_DB=collectflow                  # database name
FILES_DIR=./files                       # where uploaded files are stored
```

Uploaded files are written to disk under `files/<clientId>/<YYYY-MM-DD>/<name>`
and only the relative path is stored in Mongo. The storage layer
(`src/lib/server/storage.ts`) is an interface — an S3 / IBM COS adapter can be
added later without changing callers.

## First run

```bash
npm install          # or: bun install
npm run seed         # creates users + indexes + sample data
npm run dev          # starts Vite dev server (Node runtime)
```

Seeded logins:

| Username | Password  | Role    | Can edit |
|----------|-----------|---------|----------|
| admin    | admin123  | manager | yes      |
| viewer   | viewer123 | viewer  | no       |

`npm run seed` is idempotent for users; it only inserts sample clients/invoices
when the DB is empty (use `npm run seed -- --force` to add samples anyway).

## Verify

```bash
npm run verify   # exercises create → settle → advance → write-off → convert against Mongo (21 checks)
```

## Data model (collections)

- **clients** — master data + `enabled` flag.
- **invoices** — invoice *or* proforma (`isProforma`), amount, dates, `notes`,
  optional `filePath`, and write-off fields. Balances/status are **derived**,
  never stored (see `src/lib/derive.ts`).
- **payments** — amount + `allocations[]` (invoiceId → amount). Any unallocated
  remainder is the client's advance/on-account balance.
- **users**, **sessions** — app-user auth (scrypt hash + cookie session).

## Production note

The Vite/nitro build defaults to a **Cloudflare Workers** target, whose edge
runtime cannot run the `mongodb` driver. For deployment, switch nitro to a Node
server preset (and run the server on Node). Local `npm run dev` already uses
Node, so development is unaffected.

## Hidden screens

The original Lovable UI shipped 18 screens. Only the MVP set is wired to live
data and shown in the sidebar (Dashboard, Clients, Client 360, Invoice detail).
The other route files (inbox, follow-ups, aging, analytics, disputes, reports,
etc.) are kept in `src/routes/` but hidden from navigation — re-enable them by
adding entries back to `nav` in `src/components/app-shell.tsx` once wired.
