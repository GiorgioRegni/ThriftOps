-- CreateTable
CREATE TABLE "ImportRun" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "changedMode" TEXT NOT NULL,
    "workbookPaths" JSONB NOT NULL,
    "fileHashes" JSONB NOT NULL,
    "stats" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRecord" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "workbookName" TEXT NOT NULL,
    "sheetName" TEXT NOT NULL,
    "sourceRowNumber" INTEGER NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "rowHash" TEXT NOT NULL,
    "importedRecordType" TEXT NOT NULL,
    "importedRecordId" TEXT,
    "relatedRecordIds" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "reviewFlags" JSONB NOT NULL,
    "sourceRow" JSONB NOT NULL,
    "lastRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportRun_orgId_startedAt_idx" ON "ImportRun"("orgId", "startedAt");

-- CreateIndex
CREATE INDEX "ImportRecord_orgId_status_idx" ON "ImportRecord"("orgId", "status");

-- CreateIndex
CREATE INDEX "ImportRecord_orgId_importedRecordType_importedRecordId_idx" ON "ImportRecord"("orgId", "importedRecordType", "importedRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRecord_orgId_workbookName_sheetName_sourceKey_key" ON "ImportRecord"("orgId", "workbookName", "sheetName", "sourceKey");

-- AddForeignKey
ALTER TABLE "ImportRun" ADD CONSTRAINT "ImportRun_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRecord" ADD CONSTRAINT "ImportRecord_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
