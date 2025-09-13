# DPP‑lite Skeleton (Next.js + API + SQLite + Anchoring)

Minimal skeleton for a **DPP-lite** MVP:
- Next.js (App Router, TypeScript)
- SQLite via Prisma (easy local dev)
- Local file storage (switch to S3 later)
- API routes: **/api/products**, **/api/evidences**, **/api/verify**
- Optional anchoring to a chain via simple `AnchorRegistry.sol`

> For production: switch Prisma provider to `postgresql`, move storage to S3/MinIO, deploy AnchorRegistry on a low-fee L2.

## Quick start

```bash
cp .env.example .env
npm i
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Open http://localhost:3000

## API overview
- `POST /api/products` { sku, name, gtin?, category?, description? } → create product
- `GET /api/products` → list products
- `POST /api/evidences` (multipart form-data: file, productId?, batchId?, issuer?) → upload, hash, store metadata
- `POST /api/evidences/{id}/anchor` { chain, network, method? } → anchor hash via contract event
- `GET /api/verify?hash=HEX` → returns match + anchoring info if present

## Anchoring
Deploy `contracts/AnchorRegistry.sol` to your L2 (Remix is fine for MVP). Put the address in `.env` as `CONTRACT_ADDRESS`. Set `RPC_URL` and `PRIVATE_KEY` (fund with tiny amount).

## Storage
By default, files are saved to `./uploads`. For S3: implement the `s3` branch in `lib/storage.ts` and set env `STORAGE_DRIVER=s3` with credentials, then re-build.

## Switch to Postgres
Change `prisma/schema.prisma` provider to `postgresql` and set `DATABASE_URL` accordingly, then run migrations.

## Security / Compliance
- Only **hashes** are emitted on-chain.
- No personal data on-chain.
- Provide ToS/Privacy stating you are **not a notified body**; this is proof-of-existence/integrity only.
