-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'admin', 'member', 'viewer');

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerUid" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "taxSettings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "uid" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("orgId","uid")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "styleTags" JSONB NOT NULL,
    "seasonTags" JSONB NOT NULL,
    "measurements" JSONB NOT NULL,
    "costBasisCents" INTEGER NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "listedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "sourcePurchaseId" TEXT,
    "sourceVendor" TEXT NOT NULL,
    "sourceLocation" TEXT NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "photos" JSONB NOT NULL,
    "listingUrls" JSONB NOT NULL,
    "currentListPriceCents" INTEGER,
    "originalListPriceCents" INTEGER,
    "notes" TEXT NOT NULL,
    "importSource" JSONB,
    "reviewFlags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "subtotalCents" INTEGER,
    "taxCents" INTEGER,
    "paymentAccount" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "receiptPhotos" JSONB NOT NULL,
    "itemIds" JSONB NOT NULL,
    "allocationMode" TEXT NOT NULL,
    "allocatedTotalCents" INTEGER NOT NULL,
    "unallocatedCents" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "eventId" TEXT,
    "buyerName" TEXT,
    "buyerContact" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "grossItemSubtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "shippingChargedCents" INTEGER NOT NULL,
    "salesTaxCollectedCents" INTEGER NOT NULL,
    "marketplaceCollectedTax" BOOLEAN NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "paymentFeeCents" INTEGER NOT NULL,
    "actualShippingCostCents" INTEGER NOT NULL,
    "packagingCostCents" INTEGER NOT NULL,
    "otherCostCents" INTEGER NOT NULL,
    "totalReceivedCents" INTEGER NOT NULL,
    "payoutStatus" TEXT NOT NULL,
    "paymentIds" JSONB NOT NULL,
    "notes" TEXT NOT NULL,
    "proofPhotos" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemCode" TEXT NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "brandSnapshot" TEXT NOT NULL,
    "itemTypeSnapshot" TEXT NOT NULL,
    "categorySnapshot" TEXT NOT NULL,
    "costBasisCents" INTEGER NOT NULL,
    "allocatedSalePriceCents" INTEGER NOT NULL,
    "allocatedDiscountCents" INTEGER NOT NULL,
    "allocatedPlatformFeeCents" INTEGER NOT NULL,
    "allocatedPaymentFeeCents" INTEGER NOT NULL,
    "allocatedShippingCostCents" INTEGER NOT NULL,
    "allocatedPackagingCostCents" INTEGER NOT NULL,
    "allocatedEventFeeCents" INTEGER NOT NULL,
    "netProfitCents" INTEGER NOT NULL,
    "daysHeld" INTEGER NOT NULL,
    "daysListed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "externalTransactionId" TEXT,
    "counterparty" TEXT,
    "note" TEXT,
    "matchedSaleIds" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "importedFrom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "linkedItemId" TEXT,
    "linkedSaleId" TEXT,
    "linkedPurchaseId" TEXT,
    "receiptPhotos" JSONB NOT NULL,
    "taxDeductible" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "boothFeeCents" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "itemIdsBrought" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listPriceCents" INTEGER NOT NULL,
    "listingUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "listedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_uid_idx" ON "Member"("uid");

-- CreateIndex
CREATE INDEX "Item_orgId_category_idx" ON "Item"("orgId", "category");

-- CreateIndex
CREATE INDEX "Item_orgId_status_idx" ON "Item"("orgId", "status");

-- CreateIndex
CREATE INDEX "Item_orgId_createdAt_idx" ON "Item"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Item_orgId_itemCode_key" ON "Item"("orgId", "itemCode");

-- CreateIndex
CREATE INDEX "Purchase_orgId_date_idx" ON "Purchase"("orgId", "date");

-- CreateIndex
CREATE INDEX "Sale_orgId_soldAt_idx" ON "Sale"("orgId", "soldAt");

-- CreateIndex
CREATE INDEX "SaleItem_orgId_saleId_idx" ON "SaleItem"("orgId", "saleId");

-- CreateIndex
CREATE INDEX "SaleItem_orgId_itemId_idx" ON "SaleItem"("orgId", "itemId");

-- CreateIndex
CREATE INDEX "Payment_orgId_date_idx" ON "Payment"("orgId", "date");

-- CreateIndex
CREATE INDEX "Expense_orgId_date_idx" ON "Expense"("orgId", "date");

-- CreateIndex
CREATE INDEX "Event_orgId_date_idx" ON "Event"("orgId", "date");

-- CreateIndex
CREATE INDEX "Listing_orgId_itemId_idx" ON "Listing"("orgId", "itemId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

