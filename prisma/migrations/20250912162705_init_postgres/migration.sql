-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "gtin" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Evidence" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "issuer" TEXT,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256Hex" TEXT NOT NULL,
    "storageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Anchoring" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "chain" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "anchoredAt" TIMESTAMP(3) NOT NULL,
    "merkleRoot" TEXT,
    "method" TEXT,

    CONSTRAINT "Anchoring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_publicId_key" ON "public"."Product"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_sha256Hex_key" ON "public"."Evidence"("sha256Hex");

-- CreateIndex
CREATE INDEX "Evidence_sha256Hex_idx" ON "public"."Evidence"("sha256Hex");

-- CreateIndex
CREATE UNIQUE INDEX "Anchoring_evidenceId_key" ON "public"."Anchoring"("evidenceId");

-- AddForeignKey
ALTER TABLE "public"."Evidence" ADD CONSTRAINT "Evidence_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Anchoring" ADD CONSTRAINT "Anchoring_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "public"."Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
