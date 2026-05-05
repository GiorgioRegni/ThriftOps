export type ISODateString = string;

export type Category = "women" | "kids" | "home_goods" | "uncategorized";
export type ItemStatus = "draft" | "active" | "listed" | "reserved" | "sold" | "donated" | "lost" | "returned";
export type Condition = "new_with_tags" | "excellent" | "good" | "fair" | "flawed" | "unknown";
export type PhotoKind = "front" | "back" | "brand_tag" | "size_fabric_tag" | "price_tag" | "flaw" | "other";
export type MemberRole = "owner" | "admin" | "member" | "viewer";
export type SaleChannel = "in_person_market" | "noihsaf" | "facebook_marketplace" | "instagram" | "own_website" | "venmo_direct" | "paypal_direct" | "cash" | "other";
export type PaymentMethod = "cash" | "venmo" | "paypal" | "stripe" | "card" | "marketplace_payout" | "other";
export type PayoutStatus = "unmatched" | "partially_matched" | "matched" | "not_applicable";
export type PaymentSource = "venmo" | "paypal" | "noihsaf" | "stripe" | "cash" | "bank" | "other";
export type PaymentStatus = "unmatched" | "partially_matched" | "matched";
export type ExpenseCategory = "inventory_purchase" | "shipping" | "packaging" | "market_booth_fee" | "cleaning_repair" | "software" | "mileage" | "supplies" | "payment_fee" | "platform_fee" | "other";
export type AllocationMode = "exact" | "equal" | "manual" | "unallocated";
export type ListingStatus = "draft" | "active" | "sold" | "ended" | "deleted";

export interface Org {
  id: string;
  name: string;
  ownerUid: string;
  defaultCurrency: "USD";
  taxSettings: {
    homeState: string;
    defaultSalesTaxRateBps?: number;
    trackSalesTax: boolean;
  };
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Member {
  uid: string;
  email: string;
  displayName: string;
  role: MemberRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ItemPhoto {
  id: string;
  url: string;
  storagePath: string;
  kind: PhotoKind;
  createdAt: ISODateString;
}

export interface ListingLink {
  channel: string;
  url: string;
  listedAt: ISODateString;
  status: ListingStatus;
}

export interface Measurements {
  bust?: string;
  waist?: string;
  hips?: string;
  length?: string;
  inseam?: string;
  rise?: string;
  sleeve?: string;
  unit: "in" | "cm";
}

export interface Item {
  id: string;
  orgId: string;
  itemCode: string;
  category: Category;
  status: ItemStatus;
  brand: string;
  itemType: string;
  title: string;
  description: string;
  size: string;
  material: string;
  color: string;
  condition: Condition;
  styleTags: string[];
  seasonTags: string[];
  measurements: Measurements;
  costBasisCents: number;
  acquiredAt: ISODateString;
  listedAt?: ISODateString;
  soldAt?: ISODateString;
  sourcePurchaseId?: string;
  sourceVendor: string;
  sourceLocation: string;
  storageLocation: string;
  photos: ItemPhoto[];
  listingUrls: ListingLink[];
  currentListPriceCents?: number;
  originalListPriceCents?: number;
  notes: string;
  importSource?: Record<string, unknown>;
  reviewFlags: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: string;
  updatedBy: string;
}

export interface Purchase {
  id: string;
  orgId: string;
  date: ISODateString;
  vendor: string;
  location: string;
  totalCents: number;
  subtotalCents?: number;
  taxCents?: number;
  paymentAccount: string;
  paymentMethod: string;
  receiptPhotos: ItemPhoto[];
  itemIds: string[];
  allocationMode: AllocationMode;
  allocatedTotalCents: number;
  unallocatedCents: number;
  notes: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: string;
  updatedBy: string;
}

export interface Sale {
  id: string;
  orgId: string;
  soldAt: ISODateString;
  channel: SaleChannel;
  eventId?: string;
  buyerName?: string;
  buyerContact?: string;
  paymentMethod: PaymentMethod;
  grossItemSubtotalCents: number;
  discountCents: number;
  shippingChargedCents: number;
  salesTaxCollectedCents: number;
  marketplaceCollectedTax: boolean;
  platformFeeCents: number;
  paymentFeeCents: number;
  actualShippingCostCents: number;
  packagingCostCents: number;
  otherCostCents: number;
  totalReceivedCents: number;
  payoutStatus: PayoutStatus;
  paymentIds: string[];
  notes: string;
  proofPhotos: ItemPhoto[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: string;
  updatedBy: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  itemId: string;
  itemCode: string;
  titleSnapshot: string;
  brandSnapshot: string;
  itemTypeSnapshot: string;
  categorySnapshot: Category;
  costBasisCents: number;
  allocatedSalePriceCents: number;
  allocatedDiscountCents: number;
  allocatedPlatformFeeCents: number;
  allocatedPaymentFeeCents: number;
  allocatedShippingCostCents: number;
  allocatedPackagingCostCents: number;
  allocatedEventFeeCents: number;
  netProfitCents: number;
  daysHeld: number;
  daysListed?: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Payment {
  id: string;
  orgId: string;
  date: ISODateString;
  source: PaymentSource;
  amountCents: number;
  externalTransactionId?: string;
  counterparty?: string;
  note?: string;
  matchedSaleIds: string[];
  status: PaymentStatus;
  importedFrom?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface Expense {
  id: string;
  orgId: string;
  date: ISODateString;
  category: ExpenseCategory;
  vendor: string;
  amountCents: number;
  paymentMethod: string;
  linkedItemId?: string;
  linkedSaleId?: string;
  linkedPurchaseId?: string;
  receiptPhotos: ItemPhoto[];
  taxDeductible: boolean;
  notes: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: string;
  updatedBy: string;
}

export interface Event {
  id: string;
  orgId: string;
  name: string;
  date: ISODateString;
  location: string;
  boothFeeCents: number;
  notes: string;
  itemIdsBrought?: string[];
  createdAt: ISODateString;
  updatedAt: ISODateString;
  createdBy: string;
  updatedBy: string;
}

export interface Listing {
  id: string;
  orgId: string;
  itemId: string;
  channel: string;
  title: string;
  description: string;
  listPriceCents: number;
  listingUrl: string;
  status: ListingStatus;
  listedAt: ISODateString;
  endedAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ExtractedItemDraft {
  brand?: string;
  itemType?: string;
  size?: string;
  material?: string;
  color?: string;
  confidence: number;
  notes: string[];
}
