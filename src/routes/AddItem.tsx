import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Check, Plus } from "lucide-react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { PhotoUploader } from "../components/forms/PhotoUploader";
import { SelectField } from "../components/forms/SelectField";
import { TextField } from "../components/forms/TextField";
import { centsFromDecimal } from "../lib/money";
import { timestampFromInput, todayInput } from "../lib/dates";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { createItem } from "../services/itemService";
import { extractItemDraftFromPhotos } from "../services/aiExtractionService";
import type { ExtractedItemDraft, ItemPhoto } from "../types/domain";
import { PageHeader, PrimaryButton, SecondaryButton, SurfaceCard } from "../components/common/ui";

const schema = z.object({
  category: z.enum(["women", "kids", "home_goods", "uncategorized"]),
  brand: z.string().optional(),
  itemType: z.string().min(1),
  title: z.string().min(1),
  costBasis: z.string(),
  acquiredAt: z.string().min(1)
});

export const AddItem = () => {
  const { user } = useAuth();
  const { org } = useOrg();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<ItemPhoto[]>([]);
  const [suggestions, setSuggestions] = useState<ExtractedItemDraft | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "women",
    brand: "",
    itemType: "",
    title: "",
    description: "",
    size: "",
    material: "",
    color: "",
    condition: "unknown",
    costBasis: "",
    acquiredAt: todayInput(),
    sourceVendor: "Goodwill",
    sourceLocation: "",
    storageLocation: "",
    currentListPrice: "",
    notes: ""
  });
  if (!org || !user) return null;
  const setValue = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form
      id="add-item-form"
      className="mx-auto max-w-3xl space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = schema.safeParse(form);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check required fields.");
          return;
        }
        try {
          const id = await createItem(org.id, user.uid, {
            category: parsed.data.category,
            status: "active",
            brand: form.brand,
            itemType: form.itemType,
            title: form.title,
            description: form.description,
            size: form.size,
            material: form.material,
            color: form.color,
            condition: form.condition as "unknown",
            measurements: { unit: "in" },
            costBasisCents: centsFromDecimal(form.costBasis),
            acquiredAt: timestampFromInput(form.acquiredAt),
            sourceVendor: form.sourceVendor,
            sourceLocation: form.sourceLocation,
            storageLocation: form.storageLocation,
            currentListPriceCents: centsFromDecimal(form.currentListPrice),
            notes: form.notes,
            photos
          });
          navigate(`/inventory/${id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to save item.");
        }
      }}
    >
      <PageHeader title="Add Item" back actions={<button className="tap rounded-xl px-3 text-sm font-bold text-primary-600 md:bg-primary-600 md:text-white">Save</button>} />
      <SurfaceCard>
        <h3 className="mb-3 text-sm font-bold">Photos</h3>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.kind} className="aspect-square rounded-xl object-cover" />)}
          <div className="grid aspect-square place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-primary-600"><Plus size={24} /></div>
        </div>
        <PhotoUploader
          orgId={org.id}
          path="items/draft/photos"
          onUploaded={async (nextPhotos) => {
            const all = [...photos, ...nextPhotos];
            setPhotos(all);
            setSuggestions(await extractItemDraftFromPhotos(all));
          }}
        />
      </SurfaceCard>
      {suggestions ? (
        <SurfaceCard>
          <h3 className="font-semibold">AI suggestions</h3>
          <p className="mt-1 text-sm text-muted">Confidence {Math.round(suggestions.confidence * 100)}%. Confirm suggestions before saving.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.brand ? <SecondaryButton type="button" onClick={() => setValue("brand", suggestions.brand ?? "")}>Use brand</SecondaryButton> : null}
            {suggestions.itemType ? <SecondaryButton type="button" onClick={() => setValue("itemType", suggestions.itemType ?? "")}>Use type</SecondaryButton> : null}
          </div>
        </SurfaceCard>
      ) : null}
      <SurfaceCard className="grid gap-4 md:grid-cols-2">
        <SelectField label="Category" value={form.category} onChange={(event) => setValue("category", event.target.value)} options={[{ value: "women", label: "Women" }, { value: "kids", label: "Kids" }, { value: "home_goods", label: "Home goods" }, { value: "uncategorized", label: "Uncategorized" }]} />
        <SelectField label="Condition" value={form.condition} onChange={(event) => setValue("condition", event.target.value)} options={["new_with_tags", "excellent", "good", "fair", "flawed", "unknown"].map((value) => ({ value, label: value.replaceAll("_", " ") }))} />
        <TextField label="Brand" value={form.brand} onChange={(event) => setValue("brand", event.target.value)} />
        <TextField label="Item type" value={form.itemType} onChange={(event) => setValue("itemType", event.target.value)} />
        <TextField label="Title" value={form.title} onChange={(event) => setValue("title", event.target.value)} />
        <TextField label="Size" value={form.size} onChange={(event) => setValue("size", event.target.value)} />
        <TextField label="Material" value={form.material} onChange={(event) => setValue("material", event.target.value)} />
        <TextField label="Color" value={form.color} onChange={(event) => setValue("color", event.target.value)} />
        <MoneyInput label="Cost basis" value={form.costBasis} onChange={(event) => setValue("costBasis", event.target.value)} />
        <DateInput label="Acquired at" value={form.acquiredAt} onChange={(event) => setValue("acquiredAt", event.target.value)} />
        <TextField label="Source vendor" value={form.sourceVendor} onChange={(event) => setValue("sourceVendor", event.target.value)} />
        <TextField label="Source location" value={form.sourceLocation} onChange={(event) => setValue("sourceLocation", event.target.value)} />
        <TextField label="Storage location" value={form.storageLocation} onChange={(event) => setValue("storageLocation", event.target.value)} />
        <MoneyInput label="Current list price" value={form.currentListPrice} onChange={(event) => setValue("currentListPrice", event.target.value)} />
      </SurfaceCard>
      <SurfaceCard className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Description</span>
          <textarea className="min-h-24 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50" value={form.description} onChange={(event) => setValue("description", event.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">Notes</span>
          <textarea className="min-h-20 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50" value={form.notes} onChange={(event) => setValue("notes", event.target.value)} />
        </label>
      </SurfaceCard>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="sticky bottom-20 z-10 md:static">
        <PrimaryButton className="w-full"><Check size={16} className="mr-2 inline" />Save item</PrimaryButton>
      </div>
    </form>
  );
};
