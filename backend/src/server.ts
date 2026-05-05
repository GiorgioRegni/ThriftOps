import "dotenv/config";
import express from "express";
import cors from "cors";
import { Prisma } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";
import { averageOrderValue, grossMarginRate, grossReturnMultiple, inventoryRevenuePotential, netProfitForSaleItem, saleLevelNetProfit, shippingProfitLoss } from "../../src/lib/calculations.ts";
import { generateItemCode, nextSequenceFromCodes } from "../../src/lib/ids.ts";
import { asyncRoute, errorHandler, HttpError, isFullAdmin, requireAuth, requireManageRole, requireOrgMember, requireWriteRole } from "./http.ts";
import { hasItemPageQuery, itemOrderByFromSort, itemWhereFromPageQuery, parseItemPageQuery } from "./itemQuery.ts";
import { mirrorOrgMember, mirrorOrgOwner, mirrorOrgUpdate } from "./firestoreMirror.ts";
import { prisma } from "./prisma.ts";

const app = express();
const port = Number(process.env.API_PORT || 8080);
const allowedOrigins = (process.env.API_ALLOWED_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));

const parseDate = (value: unknown, fallback = new Date()) => (typeof value === "string" || value instanceof Date ? new Date(value) : fallback);
const jsonArray = (value: unknown): Prisma.InputJsonValue => Array.isArray(value) ? value as Prisma.InputJsonArray : [];
const jsonObject = (value: unknown): Prisma.InputJsonValue | undefined => value && typeof value === "object" ? value as Prisma.InputJsonObject : undefined;
const body = (req: express.Request) => req.body as Record<string, any>;
const param = (req: express.Request, key: string) => String(req.params[key]);
const allocate = (amount: number, itemAmount: number, total: number) => (total ? Math.round((amount * itemAmount) / total) : 0);
const dateDiff = (end?: Date | null, start?: Date | null) => end && start ? Math.max(0, differenceInCalendarDays(end, start)) : 0;
const activeItemStatuses = ["draft", "active", "listed", "reserved"];
const csvValues = (value: unknown): string[] => String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
const positiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const saleItemsBySaleId = <T extends { saleId: string }>(saleItems: T[]) => saleItems.reduce<Record<string, T[]>>((acc, saleItem) => {
  acc[saleItem.saleId] = [...(acc[saleItem.saleId] ?? []), saleItem];
  return acc;
}, {});
const salesMetricSummary = <T extends {
  id: string;
  grossItemSubtotalCents: number;
  discountCents: number;
  shippingChargedCents: number;
  platformFeeCents: number;
  paymentFeeCents: number;
  actualShippingCostCents: number;
  packagingCostCents: number;
  otherCostCents: number;
}>(sales: T[], bySale: Record<string, Array<{ costBasisCents: number }>>) => {
  const grossSalesCents = sales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0);
  const cogsCents = sales.reduce((sum, sale) => sum + (bySale[sale.id] ?? []).reduce((itemSum, saleItem) => itemSum + saleItem.costBasisCents, 0), 0);
  return {
    grossSalesCents,
    cogsCents,
    netProfitCents: sales.reduce((sum, sale) => sum + saleLevelNetProfit(sale, bySale[sale.id] ?? []), 0),
    soldItems: sales.reduce((sum, sale) => sum + (bySale[sale.id] ?? []).length, 0),
    averageOrderValueCents: averageOrderValue(grossSalesCents, sales.length),
    grossReturnMultiple: grossReturnMultiple(grossSalesCents, cogsCents),
    grossMarginRate: grossMarginRate(grossSalesCents, cogsCents),
    multiItemSaleRate: sales.length ? sales.filter((sale) => (bySale[sale.id] ?? []).length >= 2).length / sales.length : 0,
    shippingProfitLossCents: sales.reduce((sum, sale) => sum + shippingProfitLoss(sale.shippingChargedCents, sale.actualShippingCostCents, sale.packagingCostCents), 0)
  };
};

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", requireAuth);

app.get("/api/orgs", asyncRoute(async (req, res) => {
  if (isFullAdmin(req.user)) {
    const orgs = await prisma.org.findMany({ orderBy: { createdAt: "asc" } });
    await Promise.all(orgs.map((org) => mirrorOrgMember({
      orgId: org.id,
      uid: req.user!.uid,
      email: req.user!.email,
      displayName: req.user!.displayName,
      role: "admin"
    })));
    res.json(orgs);
    return;
  }
  const memberships = await prisma.member.findMany({
    where: { uid: req.user!.uid },
    include: { org: true },
    orderBy: { createdAt: "asc" }
  });
  res.json(memberships.map((membership) => membership.org));
}));

app.post("/api/orgs", asyncRoute(async (req, res) => {
  const input = body(req);
  const org = await prisma.$transaction(async (tx) => {
    const created = await tx.org.create({
      data: {
        name: String(input.name || "My ThriftOps"),
        ownerUid: req.user!.uid,
        defaultCurrency: "USD",
        taxSettings: {
          homeState: String(input.homeState || ""),
          defaultSalesTaxRateBps: input.defaultSalesTaxRateBps,
          trackSalesTax: Boolean(input.trackSalesTax)
        }
      }
    });
    await tx.member.create({
      data: {
        orgId: created.id,
        uid: req.user!.uid,
        email: req.user!.email,
        displayName: req.user!.displayName,
        role: "owner"
      }
    });
    return created;
  });
  await mirrorOrgOwner({ orgId: org.id, uid: req.user!.uid, email: req.user!.email, displayName: req.user!.displayName, orgName: org.name });
  res.status(201).json({ id: org.id, org });
}));

app.post("/api/orgs/join", asyncRoute(async (req, res) => {
  const input = body(req);
  const orgId = String(input.orgId || "").trim();
  if (!orgId) throw new HttpError(400, "Organization ID is required.");

  const org = await prisma.org.findUnique({ where: { id: orgId } });
  if (!org) throw new HttpError(404, "Organization not found.");

  await prisma.member.upsert({
    where: { orgId_uid: { orgId, uid: req.user!.uid } },
    create: {
      orgId,
      uid: req.user!.uid,
      email: req.user!.email,
      displayName: req.user!.displayName,
      role: "member"
    },
    update: {
      email: req.user!.email,
      displayName: req.user!.displayName
    }
  });
  await mirrorOrgMember({ orgId, uid: req.user!.uid, email: req.user!.email, displayName: req.user!.displayName, role: "member" });
  res.status(201).json({ id: org.id, org });
}));

app.patch("/api/orgs/:orgId", requireOrgMember, requireManageRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const orgId = param(req, "orgId");
  const org = await prisma.org.update({
    where: { id: orgId },
    data: {
      ...(input.name ? { name: String(input.name) } : {}),
      ...(input.homeState || input.trackSalesTax !== undefined || input.defaultSalesTaxRateBps !== undefined ? {
        taxSettings: {
          homeState: String(input.homeState || ""),
          trackSalesTax: Boolean(input.trackSalesTax),
          defaultSalesTaxRateBps: input.defaultSalesTaxRateBps
        }
      } : {})
    }
  });
  await mirrorOrgUpdate(org.id, { name: org.name, ownerUid: org.ownerUid });
  res.json(org);
}));

app.use("/api/orgs/:orgId", requireOrgMember);

app.get("/api/orgs/:orgId/items", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  if (!hasItemPageQuery(req.query)) {
    res.json(await prisma.item.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }));
    return;
  }

  const pageQuery = parseItemPageQuery(req.query);
  const where = itemWhereFromPageQuery(orgId, pageQuery);
  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      orderBy: itemOrderByFromSort(pageQuery.sort),
      skip: (pageQuery.page - 1) * pageQuery.pageSize,
      take: pageQuery.pageSize
    }),
    prisma.item.count({ where })
  ]);

  res.json({ items, total, page: pageQuery.page, pageSize: pageQuery.pageSize });
}));

app.get("/api/orgs/:orgId/items/search", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  const query = String(req.query.query || "").trim();
  const limit = Math.min(25, positiveInt(req.query.limit, 8));
  if (!query) {
    res.json([]);
    return;
  }
  const itemCode = query.replace(/^thriftops:item:/i, "");
  res.json(await prisma.item.findMany({
    where: {
      orgId,
      status: { not: "sold" },
      OR: [
        { id: query },
        { itemCode: { equals: itemCode, mode: "insensitive" } },
        { itemCode: { contains: itemCode, mode: "insensitive" } },
        { brand: { contains: query, mode: "insensitive" } },
        { title: { contains: query, mode: "insensitive" } },
        { itemType: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit
  }));
}));

app.get("/api/orgs/:orgId/items/:itemId", asyncRoute(async (req, res) => {
  const item = await prisma.item.findFirst({ where: { id: param(req, "itemId"), orgId: param(req, "orgId") } });
  if (!item) throw new HttpError(404, "Item not found.");
  res.json(item);
}));

app.post("/api/orgs/:orgId/items", requireWriteRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const orgId = param(req, "orgId");
  const existing = await prisma.item.findMany({ where: { orgId, category: input.category }, select: { itemCode: true } });
  const itemCode = input.itemCode || generateItemCode(input.category, nextSequenceFromCodes(existing.map((item) => item.itemCode), input.category));
  const item = await prisma.item.create({
    data: {
      orgId,
      itemCode,
      category: String(input.category || "uncategorized"),
      status: String(input.status || "draft"),
      brand: String(input.brand || ""),
      itemType: String(input.itemType || ""),
      title: String(input.title || ""),
      description: String(input.description || ""),
      size: String(input.size || ""),
      material: String(input.material || ""),
      color: String(input.color || ""),
      condition: String(input.condition || "unknown"),
      styleTags: jsonArray(input.styleTags),
      seasonTags: jsonArray(input.seasonTags),
      measurements: jsonObject(input.measurements) || { unit: "in" },
      costBasisCents: Number(input.costBasisCents || 0),
      acquiredAt: parseDate(input.acquiredAt),
      listedAt: input.listedAt ? parseDate(input.listedAt) : undefined,
      soldAt: input.soldAt ? parseDate(input.soldAt) : undefined,
      sourcePurchaseId: input.sourcePurchaseId,
      sourceVendor: String(input.sourceVendor || ""),
      sourceLocation: String(input.sourceLocation || ""),
      storageLocation: String(input.storageLocation || ""),
      photos: jsonArray(input.photos),
      listingUrls: jsonArray(input.listingUrls),
      currentListPriceCents: input.currentListPriceCents,
      originalListPriceCents: input.originalListPriceCents,
      notes: String(input.notes || ""),
      importSource: jsonObject(input.importSource),
      reviewFlags: jsonArray(input.reviewFlags),
      createdBy: req.user!.uid,
      updatedBy: req.user!.uid
    }
  });
  res.status(201).json({ id: item.id, item });
}));

app.patch("/api/orgs/:orgId/items/:itemId", requireWriteRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const dateFields = ["acquiredAt", "listedAt", "soldAt"];
  const data: Record<string, unknown> = { ...input, updatedBy: req.user!.uid };
  dateFields.forEach((field) => {
    if (field in data) data[field] = data[field] ? parseDate(data[field]) : null;
  });
  const item = await prisma.item.update({ where: { id: param(req, "itemId"), orgId: param(req, "orgId") }, data });
  res.json(item);
}));

app.delete("/api/orgs/:orgId/items/:itemId", requireManageRole, asyncRoute(async (req, res) => {
  await prisma.item.delete({ where: { id: param(req, "itemId"), orgId: param(req, "orgId") } });
  res.status(204).end();
}));

app.post("/api/orgs/:orgId/items/:itemId/photos", requireWriteRole, asyncRoute(async (req, res) => {
  const item = await prisma.item.findFirstOrThrow({ where: { id: param(req, "itemId"), orgId: param(req, "orgId") } });
  const photos = [...(Array.isArray(item.photos) ? item.photos : []), ...(Array.isArray(body(req).photos) ? body(req).photos : [])];
  const updated = await prisma.item.update({ where: { id: item.id }, data: { photos, updatedBy: req.user!.uid } });
  res.json(updated);
}));

app.get("/api/orgs/:orgId/dashboard", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const staleThreshold = new Date(now);
  staleThreshold.setDate(staleThreshold.getDate() - 90);
  const activeInventory = await prisma.item.aggregate({ where: { orgId, status: { in: activeItemStatuses } }, _count: true, _sum: { costBasisCents: true } });
  const activeInventoryValueCents = activeInventory._sum.costBasisCents ?? 0;
  const staleInventoryCount90Plus = await prisma.item.count({ where: { orgId, status: { in: activeItemStatuses }, acquiredAt: { lt: staleThreshold } } });
  const staleItems = await prisma.item.findMany({ where: { orgId, status: { in: activeItemStatuses } }, orderBy: [{ acquiredAt: "asc" }, { id: "asc" }], take: 3 });
  const allSales = await prisma.sale.findMany({ where: { orgId }, orderBy: { soldAt: "desc" } });
  const monthSales = await prisma.sale.findMany({ where: { orgId, soldAt: { gte: monthStart, lte: now } }, orderBy: { soldAt: "desc" } });
  const lastMonthSales = await prisma.sale.findMany({ where: { orgId, soldAt: { gte: lastMonthStart, lt: monthStart } }, orderBy: { soldAt: "desc" } });
  const recentSales = await prisma.sale.findMany({ where: { orgId }, orderBy: { soldAt: "desc" }, take: 5 });
  const unmatchedPaymentCount = await prisma.payment.count({ where: { orgId, status: { not: "matched" } } });
  const saleItems = allSales.length ? await prisma.saleItem.findMany({ where: { orgId, saleId: { in: allSales.map((sale) => sale.id) } } }) : [];
  const bySale = saleItemsBySaleId(saleItems);
  const allTimeMetrics = salesMetricSummary(allSales, bySale);
  const monthMetrics = salesMetricSummary(monthSales, bySale);
  const lastMonthMetrics = salesMetricSummary(lastMonthSales, bySale);

  res.json({
    metrics: {
      grossSalesAllTimeCents: allTimeMetrics.grossSalesCents,
      netProfitAllTimeCents: allTimeMetrics.netProfitCents,
      grossSalesThisMonthCents: monthMetrics.grossSalesCents,
      netProfitThisMonthCents: monthMetrics.netProfitCents,
      grossSalesLastMonthCents: lastMonthMetrics.grossSalesCents,
      netProfitLastMonthCents: lastMonthMetrics.netProfitCents,
      activeInventoryValueCents,
      activeItemCount: activeInventory._count,
      inventoryRevenuePotentialCents: inventoryRevenuePotential(activeInventoryValueCents, allTimeMetrics.grossReturnMultiple),
      soldItemsAllTime: allTimeMetrics.soldItems,
      soldItemsThisMonth: monthMetrics.soldItems,
      soldItemsLastMonth: lastMonthMetrics.soldItems,
      cogsAllTimeCents: allTimeMetrics.cogsCents,
      cogsThisMonthCents: monthMetrics.cogsCents,
      cogsLastMonthCents: lastMonthMetrics.cogsCents,
      averageOrderValueAllTimeCents: allTimeMetrics.averageOrderValueCents,
      averageOrderValueThisMonthCents: monthMetrics.averageOrderValueCents,
      averageOrderValueLastMonthCents: lastMonthMetrics.averageOrderValueCents,
      averageOrderValueCents: allTimeMetrics.averageOrderValueCents,
      grossReturnMultipleAllTime: allTimeMetrics.grossReturnMultiple,
      grossReturnMultipleThisMonth: monthMetrics.grossReturnMultiple,
      grossReturnMultipleLastMonth: lastMonthMetrics.grossReturnMultiple,
      grossMarginRateAllTime: allTimeMetrics.grossMarginRate,
      grossMarginRateThisMonth: monthMetrics.grossMarginRate,
      grossMarginRateLastMonth: lastMonthMetrics.grossMarginRate,
      multiItemSaleRateAllTime: allTimeMetrics.multiItemSaleRate,
      multiItemSaleRateThisMonth: monthMetrics.multiItemSaleRate,
      multiItemSaleRateLastMonth: lastMonthMetrics.multiItemSaleRate,
      multiItemSaleRate: allTimeMetrics.multiItemSaleRate,
      shippingProfitLossAllTimeCents: allTimeMetrics.shippingProfitLossCents,
      shippingProfitLossThisMonthCents: monthMetrics.shippingProfitLossCents,
      shippingProfitLossLastMonthCents: lastMonthMetrics.shippingProfitLossCents,
      shippingProfitLossCents: allTimeMetrics.shippingProfitLossCents,
      staleInventoryCount90Plus,
      unmatchedPaymentCount
    },
    recentSales: recentSales.map((sale) => ({ ...sale, itemCount: (bySale[sale.id] ?? []).length })),
    staleItems
  });
}));

app.get("/api/orgs/:orgId/sales", asyncRoute(async (req, res) => {
  res.json(await prisma.sale.findMany({ where: { orgId: param(req, "orgId") }, orderBy: { soldAt: "desc" } }));
}));

app.get("/api/orgs/:orgId/sales/summary", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  const page = positiveInt(req.query.page, 1);
  const pageSize = Math.min(100, positiveInt(req.query.pageSize, 25));
  const channel = String(req.query.channel || "").trim();
  const multiOnly = String(req.query.multiOnly || "") === "true";
  const baseWhere: Prisma.SaleWhereInput = { orgId, ...(channel ? { channel } : {}) };
  const multiSaleIds = multiOnly
    ? (await prisma.saleItem.groupBy({ by: ["saleId"], where: { orgId }, _count: true })).filter((row) => row._count >= 2).map((row) => row.saleId)
    : undefined;
  const where: Prisma.SaleWhereInput = { ...baseWhere, ...(multiSaleIds ? { id: { in: multiSaleIds } } : {}) };
  const sales = await prisma.sale.findMany({ where, orderBy: [{ soldAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize });
  const total = await prisma.sale.count({ where });
  const saleIds = sales.map((sale) => sale.id);
  const itemGroups = saleIds.length ? await prisma.saleItem.groupBy({ by: ["saleId"], where: { orgId, saleId: { in: saleIds } }, _count: true, _sum: { costBasisCents: true } }) : [];
  const itemStats = new Map(itemGroups.map((group) => [group.saleId, { itemCount: group._count, costBasisCents: group._sum.costBasisCents ?? 0 }]));
  res.json({
    rows: sales.map((sale) => {
      const stats = itemStats.get(sale.id) ?? { itemCount: 0, costBasisCents: 0 };
      return {
        id: sale.id,
        soldAt: sale.soldAt,
        channel: sale.channel,
        grossItemSubtotalCents: sale.grossItemSubtotalCents,
        netProfitCents: sale.grossItemSubtotalCents - sale.discountCents + sale.shippingChargedCents - sale.platformFeeCents - sale.paymentFeeCents - sale.actualShippingCostCents - sale.packagingCostCents - sale.otherCostCents - stats.costBasisCents,
        itemCount: stats.itemCount,
        payoutStatus: sale.payoutStatus
      };
    }),
    total,
    page,
    pageSize
  });
}));

app.get("/api/orgs/:orgId/sale-items", asyncRoute(async (req, res) => {
  const saleIds = csvValues(req.query.saleIds);
  if (!saleIds.length) {
    res.json([]);
    return;
  }
  res.json(await prisma.saleItem.findMany({ where: { orgId: param(req, "orgId"), saleId: { in: saleIds } } }));
}));

app.get("/api/orgs/:orgId/sales/:saleId", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  const saleId = param(req, "saleId");
  const sale = await prisma.sale.findFirst({ where: { orgId, id: saleId } });
  const items = await prisma.saleItem.findMany({ where: { orgId, saleId } });
  if (!sale) throw new HttpError(404, "Sale not found.");
  res.json({ sale, items });
}));

app.get("/api/orgs/:orgId/sales/:saleId/items", asyncRoute(async (req, res) => {
  res.json(await prisma.saleItem.findMany({ where: { orgId: param(req, "orgId"), saleId: param(req, "saleId") } }));
}));

app.post("/api/orgs/:orgId/sales", requireWriteRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const orgId = param(req, "orgId");
  const result = await prisma.$transaction(async (tx) => {
    const cart = Array.isArray(input.items) ? input.items : [];
    const itemIds = cart.map((entry: any) => entry.item?.id).filter(Boolean);
    const dbItems = await tx.item.findMany({ where: { orgId, id: { in: itemIds } } });
    const byId = new Map(dbItems.map((item) => [item.id, item]));
    const grossItemSubtotalCents = cart.reduce((sum: number, entry: any) => sum + Number(entry.salePriceCents || 0), 0);
    const totalReceivedCents = grossItemSubtotalCents - Number(input.discountCents || 0) + Number(input.shippingChargedCents || 0) + Number(input.salesTaxCollectedCents || 0);
    const sale = await tx.sale.create({
      data: {
        orgId,
        soldAt: parseDate(input.soldAt),
        channel: String(input.channel || "other"),
        eventId: input.eventId,
        buyerName: input.buyerName,
        buyerContact: input.buyerContact,
        paymentMethod: String(input.paymentMethod || "other"),
        grossItemSubtotalCents,
        discountCents: Number(input.discountCents || 0),
        shippingChargedCents: Number(input.shippingChargedCents || 0),
        salesTaxCollectedCents: Number(input.salesTaxCollectedCents || 0),
        marketplaceCollectedTax: Boolean(input.marketplaceCollectedTax),
        platformFeeCents: Number(input.platformFeeCents || 0),
        paymentFeeCents: Number(input.paymentFeeCents || 0),
        actualShippingCostCents: Number(input.actualShippingCostCents || 0),
        packagingCostCents: Number(input.packagingCostCents || 0),
        otherCostCents: Number(input.otherCostCents || 0),
        totalReceivedCents,
        payoutStatus: String(input.payoutStatus || "unmatched"),
        paymentIds: [],
        notes: String(input.notes || ""),
        proofPhotos: [],
        createdBy: req.user!.uid,
        updatedBy: req.user!.uid
      }
    });
    const saleItems = [];
    for (const entry of cart) {
      const item = byId.get(entry.item?.id);
      if (!item) throw new HttpError(400, "Sale contains an item outside this org.");
      const salePrice = Number(entry.salePriceCents || 0);
      const base = {
        allocatedSalePriceCents: salePrice,
        allocatedDiscountCents: allocate(Number(input.discountCents || 0), salePrice, grossItemSubtotalCents),
        costBasisCents: item.costBasisCents,
        allocatedPlatformFeeCents: allocate(Number(input.platformFeeCents || 0), salePrice, grossItemSubtotalCents),
        allocatedPaymentFeeCents: allocate(Number(input.paymentFeeCents || 0), salePrice, grossItemSubtotalCents),
        allocatedShippingCostCents: allocate(Number(input.actualShippingCostCents || 0), salePrice, grossItemSubtotalCents),
        allocatedPackagingCostCents: allocate(Number(input.packagingCostCents || 0), salePrice, grossItemSubtotalCents),
        allocatedEventFeeCents: 0
      };
      saleItems.push(await tx.saleItem.create({
        data: {
          orgId,
          saleId: sale.id,
          itemId: item.id,
          itemCode: item.itemCode,
          titleSnapshot: item.title,
          brandSnapshot: item.brand,
          itemTypeSnapshot: item.itemType,
          categorySnapshot: item.category,
          ...base,
          netProfitCents: netProfitForSaleItem(base),
          daysHeld: dateDiff(parseDate(input.soldAt), item.acquiredAt),
          daysListed: item.listedAt ? dateDiff(parseDate(input.soldAt), item.listedAt) : undefined
        }
      }));
      await tx.item.update({ where: { id: item.id }, data: { status: "sold", soldAt: parseDate(input.soldAt), updatedBy: req.user!.uid } });
    }
    return { sale, saleItems, netProfitCents: saleLevelNetProfit(sale as any, saleItems) };
  });
  res.status(201).json({ saleId: result.sale.id, netProfitCents: result.netProfitCents });
}));

app.patch("/api/orgs/:orgId/sales/payment-match", requireWriteRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const saleIds = Array.isArray(input.saleIds) ? input.saleIds : [];
  const orgId = param(req, "orgId");
  await prisma.$transaction([
    prisma.payment.update({ where: { id: input.paymentId, orgId }, data: { matchedSaleIds: saleIds, status: input.status || "matched" } }),
    prisma.sale.updateMany({ where: { orgId, id: { in: saleIds } }, data: { payoutStatus: "matched", paymentIds: [input.paymentId] } })
  ]);
  res.json({ ok: true });
}));

app.patch("/api/orgs/:orgId/sales/:saleId/payment-match", requireWriteRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const orgId = param(req, "orgId");
  const saleId = param(req, "saleId");
  const paymentId = String(input.paymentId || "");
  if (!paymentId) throw new HttpError(400, "paymentId is required.");
  await prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId, orgId }, data: { matchedSaleIds: [saleId], status: input.status || "matched" } }),
    prisma.sale.update({ where: { id: saleId, orgId }, data: { payoutStatus: "matched", paymentIds: [paymentId] } })
  ]);
  res.json({ ok: true });
}));

app.get("/api/orgs/:orgId/reconciliation", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  const payments = await prisma.payment.findMany({
    where: { orgId, status: { not: "matched" } },
    orderBy: { date: "desc" },
    select: { id: true, source: true, amountCents: true, date: true }
  });
  const sales = await prisma.sale.findMany({
    where: { orgId, payoutStatus: { not: "matched" } },
    orderBy: { soldAt: "desc" },
    select: { id: true, channel: true, totalReceivedCents: true, soldAt: true }
  });
  res.json({
    payments,
    sales,
    suggestions: payments.flatMap((payment) =>
      sales
        .filter((sale) => Math.abs(payment.amountCents - sale.totalReceivedCents) <= 100)
        .map((sale) => ({ payment: payment.id, sale: sale.id, amountCents: payment.amountCents, reason: "Exact or near amount match" }))
    )
  });
}));

app.get("/api/orgs/:orgId/events/summary", asyncRoute(async (req, res) => {
  const orgId = param(req, "orgId");
  const events = await prisma.event.findMany({ where: { orgId }, orderBy: { date: "desc" } });
  const latest = events[0];
  if (!latest) {
    res.json({ events, latest: null });
    return;
  }
  const sales = await prisma.sale.findMany({ where: { orgId, eventId: latest.id } });
  const saleIds = sales.map((sale) => sale.id);
  const itemCount = saleIds.length ? await prisma.saleItem.count({ where: { orgId, saleId: { in: saleIds } } }) : 0;
  const grossCents = sales.reduce((sum, sale) => sum + sale.grossItemSubtotalCents, 0);
  res.json({
    events,
    latest: {
      eventId: latest.id,
      grossCents,
      itemCount,
      averageOrderValueCents: averageOrderValue(grossCents, sales.length),
      profitAfterBoothCents: grossCents - latest.boothFeeCents
    }
  });
}));

const simpleResources = [
  ["purchases", prisma.purchase, "date"],
  ["expenses", prisma.expense, "date"],
  ["payments", prisma.payment, "date"],
  ["events", prisma.event, "date"],
  ["listings", prisma.listing, "listedAt"]
] as const;

for (const [name, model, orderField] of simpleResources) {
  app.get(`/api/orgs/:orgId/${name}`, asyncRoute(async (req, res) => {
    res.json(await (model as any).findMany({ where: { orgId: param(req, "orgId") }, orderBy: { [orderField]: "desc" } }));
  }));
  app.post(`/api/orgs/:orgId/${name}`, requireWriteRole, asyncRoute(async (req, res) => {
    const input = body(req);
    const data: Record<string, unknown> = { ...input, orgId: param(req, "orgId") };
    for (const field of ["date", "listedAt", "endedAt"]) {
      if (field in data) data[field] = data[field] ? parseDate(data[field]) : null;
    }
    if (name === "purchases") {
      data.receiptPhotos = jsonArray(input.receiptPhotos);
      data.itemIds = jsonArray(input.itemIds);
      data.allocatedTotalCents = input.allocationMode === "unallocated" ? 0 : Number(input.totalCents || 0);
      data.unallocatedCents = Number(input.totalCents || 0) - Number(data.allocatedTotalCents || 0);
    }
    if (name === "expenses") data.receiptPhotos = jsonArray(input.receiptPhotos);
    if (name === "payments") {
      data.matchedSaleIds = jsonArray(input.matchedSaleIds);
      data.status = input.status || "unmatched";
    }
    if (name === "events") data.itemIdsBrought = input.itemIdsBrought ? jsonArray(input.itemIdsBrought) : undefined;
    if (["purchases", "expenses", "events"].includes(name)) {
      data.createdBy = req.user!.uid;
      data.updatedBy = req.user!.uid;
    }
    const created = await (model as any).create({ data });
    res.status(201).json({ id: created.id, [name.slice(0, -1)]: created });
  }));
  app.patch(`/api/orgs/:orgId/${name}/:recordId`, requireWriteRole, asyncRoute(async (req, res) => {
    const input = body(req);
    const data: Record<string, unknown> = { ...input };
    for (const field of ["date", "listedAt", "endedAt"]) {
      if (field in data) data[field] = data[field] ? parseDate(data[field]) : null;
    }
    for (const field of ["receiptPhotos", "itemIds", "matchedSaleIds", "itemIdsBrought"]) {
      if (field in data) data[field] = jsonArray(data[field]);
    }
    if (["purchases", "expenses", "events"].includes(name)) data.updatedBy = req.user!.uid;
    const updated = await (model as any).update({ where: { id: param(req, "recordId"), orgId: param(req, "orgId") }, data });
    res.json(updated);
  }));
  app.delete(`/api/orgs/:orgId/${name}/:recordId`, requireManageRole, asyncRoute(async (req, res) => {
    await (model as any).delete({ where: { id: param(req, "recordId"), orgId: param(req, "orgId") } });
    res.status(204).end();
  }));
}

app.patch("/api/orgs/:orgId/payments/:paymentId/match", requireWriteRole, asyncRoute(async (req, res) => {
  const input = body(req);
  const payment = await prisma.payment.update({
    where: { id: param(req, "paymentId"), orgId: param(req, "orgId") },
    data: { matchedSaleIds: jsonArray(input.saleIds), status: input.status || "matched" }
  });
  res.json(payment);
}));

app.use(errorHandler);

app.listen(port, () => {
  console.log(`ThriftOps API listening on http://localhost:${port}`);
});
