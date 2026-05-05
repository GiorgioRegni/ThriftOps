import type { ExtractedItemDraft, ItemPhoto } from "../types/domain";

export const extractItemDraftFromPhotos = async (photoRefs: ItemPhoto[]): Promise<ExtractedItemDraft> => ({
  confidence: photoRefs.length ? 0.32 : 0,
  brand: photoRefs.length ? "Review brand tag" : undefined,
  itemType: photoRefs.length ? "Review garment type" : undefined,
  notes: ["AI/OCR extraction is stubbed in the MVP.", "Confirm every suggested field before saving accounting or inventory data."]
});
