import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { Prisma } from "@prisma/client";
import { generateItemCode, nextSequenceFromCodes } from "../../../src/lib/ids.ts";
import { buildSpreadsheetPlan, summarizePlan, type ImportPlanRecord, type ImportWorkbookPlan } from "./spreadsheetPlanner.ts";
import { prisma } from "../prisma.ts";

interface CliOptions {
  orgId?: string;
  dryRun: boolean;
  changedMode: "update" | "review";
  paths: string[];
}

interface ImportStats {
  created: number;
  updated: number;
  skipped: number;
  flagged: number;
  failed: number;
}

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = { dryRun: true, changedMode: "update", paths: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") options.dryRun = false;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--org-id") options.orgId = argv[++index];
    else if (arg.startsWith("--org-id=")) options.orgId = arg.slice("--org-id=".length);
    else if (arg === "--changed") options.changedMode = argv[++index] as CliOptions["changedMode"];
    else if (arg.startsWith("--changed=")) options.changedMode = arg.slice("--changed=".length) as CliOptions["changedMode"];
    else options.paths.push(arg);
  }
  if (!["update", "review"].includes(options.changedMode)) throw new Error("--changed must be update or review.");
  if (!options.paths.length) options.paths = ["tmp/Inventory tracking 2026.xlsx", "tmp/2nd hand sales accounting.xlsx"];
  return options;
};

const requireServiceAccountFile = () => {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountPath) throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is required.");
  JSON.parse(readFileSync(serviceAccountPath, "utf8"));
};

const resolveOrgId = async (requested?: string): Promise<string> => {
  if (requested) return requested;
  const orgs = await prisma.org.findMany({ select: { id: true, name: true } });
  if (orgs.length === 1) return orgs[0].id;
  throw new Error(`--org-id is required because ${orgs.length} orgs exist.`);
};

const toJson = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value, (_key, val) => val instanceof Date ? val.toISOString() : val));

const nextItemCode = async (tx: Prisma.TransactionClient, orgId: string, category: string): Promise<string> => {
  const existing = await tx.item.findMany({ where: { orgId, category }, select: { itemCode: true } });
  return generateItemCode(category as any, nextSequenceFromCodes(existing.map((item) => item.itemCode), category as any));
};

const upsertRecordLedger = async (tx: Prisma.TransactionClient, orgId: string, runId: string | undefined, record: ImportPlanRecord, importedRecordType: string, importedRecordId: string | undefined, relatedRecordIds: Record<string, string>, status: string) => {
  await tx.importRecord.upsert({
    where: {
      orgId_workbookName_sheetName_sourceKey: {
        orgId,
        workbookName: record.workbookName,
        sheetName: record.sheetName,
        sourceKey: record.sourceKey
      }
    },
    create: {
      orgId,
      workbookName: record.workbookName,
      sheetName: record.sheetName,
      sourceRowNumber: record.sourceRowNumber,
      sourceKey: record.sourceKey,
      rowHash: record.rowHash,
      importedRecordType,
      importedRecordId,
      relatedRecordIds: toJson(relatedRecordIds),
      status,
      reviewFlags: toJson(record.reviewFlags),
      sourceRow: toJson(record.sourceRow),
      lastRunId: runId
    },
    update: {
      sourceRowNumber: record.sourceRowNumber,
      rowHash: record.rowHash,
      importedRecordType,
      importedRecordId,
      relatedRecordIds: toJson(relatedRecordIds),
      status,
      reviewFlags: toJson(record.reviewFlags),
      sourceRow: toJson(record.sourceRow),
      lastRunId: runId
    }
  });
};

const applyRecord = async (tx: Prisma.TransactionClient, orgId: string, uid: string, runId: string, record: ImportPlanRecord, changedMode: "update" | "review", prior?: { rowHash: string; importedRecordId: string | null; relatedRecordIds: Prisma.JsonValue | null }): Promise<"created" | "updated" | "skipped" | "flagged"> => {
  if (record.status === "review") {
    await upsertRecordLedger(tx, orgId, runId, record, record.type, prior?.importedRecordId ?? undefined, {}, "review");
    return "flagged";
  }
  if (prior?.rowHash === record.rowHash) return "skipped";
  if (prior && changedMode === "review") {
    await upsertRecordLedger(tx, orgId, runId, record, record.type, prior.importedRecordId ?? undefined, {}, "review_changed");
    return "flagged";
  }
  if (record.type === "item") {
    const data = record.data;
    const itemCode = prior?.importedRecordId
      ? undefined
      : String(data.itemCode || await nextItemCode(tx, orgId, String(data.category)));
    const payload = {
      orgId,
      ...(itemCode ? { itemCode } : {}),
      category: String(data.category),
      status: String(data.status),
      brand: String(data.brand || ""),
      itemType: String(data.itemType || ""),
      title: String(data.title || ""),
      description: String(data.description || ""),
      size: String(data.size || ""),
      material: String(data.material || ""),
      color: String(data.color || ""),
      condition: String(data.condition || "unknown"),
      styleTags: toJson(data.styleTags || []),
      seasonTags: toJson(data.seasonTags || []),
      measurements: toJson(data.measurements || { unit: "in" }),
      costBasisCents: Number(data.costBasisCents || 0),
      acquiredAt: new Date(String(data.acquiredAt)),
      listedAt: data.listedAt ? new Date(String(data.listedAt)) : null,
      soldAt: data.soldAt ? new Date(String(data.soldAt)) : null,
      sourceVendor: String(data.sourceVendor || ""),
      sourceLocation: String(data.sourceLocation || ""),
      storageLocation: String(data.storageLocation || ""),
      photos: toJson(data.photos || []),
      listingUrls: toJson(data.listingUrls || []),
      currentListPriceCents: data.currentListPriceCents ? Number(data.currentListPriceCents) : null,
      originalListPriceCents: data.originalListPriceCents ? Number(data.originalListPriceCents) : null,
      notes: String(data.notes || ""),
      importSource: toJson(data.importSource || {}),
      reviewFlags: toJson(data.reviewFlags || []),
      createdBy: uid,
      updatedBy: uid
    };
    const item = prior?.importedRecordId
      ? await tx.item.update({ where: { id: prior.importedRecordId }, data: { ...payload, itemCode: undefined, updatedBy: uid } })
      : await tx.item.create({ data: payload as any });
    await upsertRecordLedger(tx, orgId, runId, record, "item", item.id, {}, "imported");
    return prior ? "updated" : "created";
  }
  if (record.type === "sale") {
    const itemRecord = await tx.importRecord.findUnique({
      where: {
        orgId_workbookName_sheetName_sourceKey: {
          orgId,
          workbookName: record.workbookName,
          sheetName: record.sheetName,
          sourceKey: record.relatedSourceKeys?.[0] || ""
        }
      }
    });
    if (!itemRecord?.importedRecordId) {
      await upsertRecordLedger(tx, orgId, runId, record, "sale", prior?.importedRecordId ?? undefined, {}, "review_missing_item");
      return "flagged";
    }
    const item = await tx.item.findUniqueOrThrow({ where: { id: itemRecord.importedRecordId } });
    const data = record.data;
    const salePayload = {
      orgId,
      soldAt: new Date(String(data.soldAt)),
      channel: String(data.channel),
      paymentMethod: String(data.paymentMethod),
      grossItemSubtotalCents: Number(data.grossItemSubtotalCents || 0),
      discountCents: Number(data.discountCents || 0),
      shippingChargedCents: Number(data.shippingChargedCents || 0),
      salesTaxCollectedCents: Number(data.salesTaxCollectedCents || 0),
      marketplaceCollectedTax: Boolean(data.marketplaceCollectedTax),
      platformFeeCents: Number(data.platformFeeCents || 0),
      paymentFeeCents: Number(data.paymentFeeCents || 0),
      actualShippingCostCents: Number(data.actualShippingCostCents || 0),
      packagingCostCents: Number(data.packagingCostCents || 0),
      otherCostCents: Number(data.otherCostCents || 0),
      totalReceivedCents: Number(data.totalReceivedCents || 0),
      payoutStatus: String(data.payoutStatus || "unmatched"),
      paymentIds: toJson(data.paymentIds || []),
      notes: String(data.notes || ""),
      proofPhotos: toJson(data.proofPhotos || []),
      createdBy: uid,
      updatedBy: uid
    };
    const sale = prior?.importedRecordId
      ? await tx.sale.update({ where: { id: prior.importedRecordId }, data: salePayload as any })
      : await tx.sale.create({ data: salePayload as any });
    await tx.saleItem.deleteMany({ where: { orgId, saleId: sale.id } });
    const saleItemData = data.saleItem as Record<string, unknown>;
    const saleItem = await tx.saleItem.create({
      data: {
        orgId,
        saleId: sale.id,
        itemId: item.id,
        itemCode: item.itemCode,
        titleSnapshot: item.title,
        brandSnapshot: item.brand,
        itemTypeSnapshot: item.itemType,
        categorySnapshot: item.category,
        costBasisCents: Number(saleItemData.costBasisCents || 0),
        allocatedSalePriceCents: Number(saleItemData.allocatedSalePriceCents || 0),
        allocatedDiscountCents: Number(saleItemData.allocatedDiscountCents || 0),
        allocatedPlatformFeeCents: Number(saleItemData.allocatedPlatformFeeCents || 0),
        allocatedPaymentFeeCents: Number(saleItemData.allocatedPaymentFeeCents || 0),
        allocatedShippingCostCents: Number(saleItemData.allocatedShippingCostCents || 0),
        allocatedPackagingCostCents: Number(saleItemData.allocatedPackagingCostCents || 0),
        allocatedEventFeeCents: Number(saleItemData.allocatedEventFeeCents || 0),
        netProfitCents: Number(saleItemData.netProfitCents || 0),
        daysHeld: Number(saleItemData.daysHeld || 0)
      }
    });
    await upsertRecordLedger(tx, orgId, runId, record, "sale", sale.id, { itemId: item.id, saleItemId: saleItem.id }, "imported");
    return prior ? "updated" : "created";
  }
  if (record.type === "payment") {
    const data = record.data;
    const payload = {
      orgId,
      date: new Date(String(data.date)),
      source: String(data.source),
      amountCents: Number(data.amountCents || 0),
      externalTransactionId: data.externalTransactionId ? String(data.externalTransactionId) : null,
      counterparty: data.counterparty ? String(data.counterparty) : null,
      note: data.note ? String(data.note) : null,
      matchedSaleIds: toJson(data.matchedSaleIds || []),
      status: String(data.status || "unmatched"),
      importedFrom: data.importedFrom ? String(data.importedFrom) : null
    };
    const payment = prior?.importedRecordId ? await tx.payment.update({ where: { id: prior.importedRecordId }, data: payload as any }) : await tx.payment.create({ data: payload as any });
    await upsertRecordLedger(tx, orgId, runId, record, "payment", payment.id, {}, "imported");
    return prior ? "updated" : "created";
  }
  if (record.type === "expense") {
    const data = record.data;
    const payload = {
      orgId,
      date: new Date(String(data.date)),
      category: String(data.category),
      vendor: String(data.vendor),
      amountCents: Number(data.amountCents || 0),
      paymentMethod: String(data.paymentMethod || ""),
      receiptPhotos: toJson(data.receiptPhotos || []),
      taxDeductible: Boolean(data.taxDeductible),
      notes: String(data.notes || ""),
      createdBy: uid,
      updatedBy: uid
    };
    const expense = prior?.importedRecordId ? await tx.expense.update({ where: { id: prior.importedRecordId }, data: payload as any }) : await tx.expense.create({ data: payload as any });
    await upsertRecordLedger(tx, orgId, runId, record, "expense", expense.id, {}, "imported");
    return prior ? "updated" : "created";
  }
  await upsertRecordLedger(tx, orgId, runId, record, "review", prior?.importedRecordId ?? undefined, {}, "review");
  return "flagged";
};

const collectPriorRecords = async (orgId: string, plans: ImportWorkbookPlan[]) => {
  const clauses = plans.flatMap((plan) => plan.records.map((record) => ({
    workbookName: record.workbookName,
    sheetName: record.sheetName,
    sourceKey: record.sourceKey
  })));
  const existing = await prisma.importRecord.findMany({ where: { orgId, OR: clauses } });
  return new Map(existing.map((record) => [`${record.workbookName}|${record.sheetName}|${record.sourceKey}`, record]));
};

const keyFor = (record: ImportPlanRecord) => `${record.workbookName}|${record.sheetName}|${record.sourceKey}`;

const run = async () => {
  requireServiceAccountFile();
  const options = parseArgs(process.argv.slice(2));
  const orgId = await resolveOrgId(options.orgId);
  const org = await prisma.org.findUniqueOrThrow({ where: { id: orgId } });
  const uid = org.ownerUid;
  const plans = buildSpreadsheetPlan(options.paths);
  const plannedSummary = summarizePlan(plans);
  const records = plans.flatMap((plan) => plan.records);
  const prior = await collectPriorRecords(orgId, plans);
  const stats: ImportStats = { created: 0, updated: 0, skipped: 0, flagged: 0, failed: 0 };
  console.log(JSON.stringify({ mode: options.dryRun ? "dry-run" : "apply", orgId, workbooks: plans.map((plan) => ({ workbookName: plan.workbookName, fileHash: plan.fileHash, records: plan.records.length })), plannedSummary }, null, 2));
  if (options.dryRun) {
    for (const record of records) {
      const existing = prior.get(keyFor(record));
      if (record.status === "review") stats.flagged += 1;
      else if (!existing) stats.created += 1;
      else if (existing.rowHash === record.rowHash) stats.skipped += 1;
      else if (options.changedMode === "review") stats.flagged += 1;
      else stats.updated += 1;
    }
    console.log(JSON.stringify({ stats }, null, 2));
    return;
  }
  const runRecord = await prisma.importRun.create({
    data: {
      orgId,
      mode: "apply",
      changedMode: options.changedMode,
      workbookPaths: toJson(options.paths.map((path) => ({ path, workbookName: basename(path) }))),
      fileHashes: toJson(Object.fromEntries(plans.map((plan) => [plan.workbookName, plan.fileHash]))),
      stats: {},
      createdBy: uid
    }
  });
  for (const record of records) {
    try {
      const result = await prisma.$transaction((tx) => applyRecord(tx, orgId, uid, runRecord.id, record, options.changedMode, prior.get(keyFor(record))));
      stats[result] += 1;
    } catch (error) {
      stats.failed += 1;
      console.error(`Failed ${record.workbookName}/${record.sheetName}/row ${record.sourceRowNumber}`, error);
    }
  }
  await prisma.importRun.update({ where: { id: runRecord.id }, data: { stats: toJson(stats), finishedAt: new Date() } });
  console.log(JSON.stringify({ importRunId: runRecord.id, stats }, null, 2));
};

run().finally(async () => {
  await prisma.$disconnect();
});
