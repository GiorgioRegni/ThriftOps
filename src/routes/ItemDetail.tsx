import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Camera, CheckCircle, Copy, Edit3, Link as LinkIcon, PackageCheck, QrCode, Tag, Upload } from "lucide-react";
import { DateInput } from "../components/forms/DateInput";
import { MoneyInput } from "../components/forms/MoneyInput";
import { PhotoUploader } from "../components/forms/PhotoUploader";
import { SelectField } from "../components/forms/SelectField";
import { TextField } from "../components/forms/TextField";
import { QRLabel } from "../components/inventory/QRLabel";
import { ItemStatusBadge } from "../components/inventory/ItemStatusBadge";
import { Loading } from "../components/common/Loading";
import { centsFromDecimal, centsToInput, formatMoney } from "../lib/money";
import { formatISODate, formatISODateTime, inputFromTimestamp, timestampFromInput } from "../lib/dates";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { addItemPhotos, getItem, updateItem, updateItemStatus } from "../services/itemService";
import type { Item } from "../types/domain";
import { ActionTile, PageHeader, PrimaryButton, SecondaryButton, SurfaceCard } from "../components/common/ui";

export const ItemDetail = () => {
  const { itemId } = useParams();
  const { org } = useOrg();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", brand: "", itemType: "", size: "", material: "", costBasis: "", listPrice: "", acquiredAt: "" });
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!org || !itemId) return;
    void getItem(org.id, itemId).then((next) => {
      if (next) {
        setItem(next);
        setForm({ title: next.title, brand: next.brand, itemType: next.itemType, size: next.size, material: next.material, costBasis: centsToInput(next.costBasisCents), listPrice: centsToInput(next.currentListPriceCents), acquiredAt: inputFromTimestamp(next.acquiredAt) });
      }
    });
  }, [itemId, org]);
  if (!org || !user || !item) return <Loading />;
  const refresh = async () => setItem(await getItem(org.id, item.id) ?? item);
  return (
    <div className="space-y-4">
      <PageHeader title="Item Details" back actions={<ItemStatusBadge status={item.status} />} />
      <div className="grid grid-cols-2 gap-2">
        {(item.photos.length ? item.photos : []).slice(0, 4).map((photo) => <img key={photo.id} className="aspect-square w-full rounded-2xl object-cover shadow-card" src={photo.url} alt={photo.kind} />)}
        {!item.photos.length ? <div className="col-span-2 grid aspect-[1.7] place-items-center rounded-2xl bg-slate-100 text-sm font-semibold text-muted shadow-card">No photos yet</div> : null}
      </div>
      <SurfaceCard>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{item.itemCode}</h2>
            <p className="mt-1 text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs text-muted">Size {item.size || "-"} · {item.material || "-"} · {item.color || "-"}</p>
          </div>
          <ItemStatusBadge status={item.status} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-muted">Cost Basis</p>
            <p className="mt-1 font-bold">{formatMoney(item.costBasisCents)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Current List Price</p>
            <p className="mt-1 font-bold">{formatMoney(item.currentListPriceCents ?? 0)}</p>
          </div>
        </div>
        <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-muted">Acquired</dt><dd className="text-right">{formatISODate(item.acquiredAt)}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Source</dt><dd className="text-right">{item.sourceVendor || "-"} {item.sourceLocation ? `· ${item.sourceLocation}` : ""}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Location</dt><dd className="text-right">{item.storageLocation || "-"}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Notes</dt><dd className="text-right">{item.notes || "-"}</dd></div>
        </dl>
      </SurfaceCard>
      <div id="item-photo-uploader">
        <PhotoUploader orgId={org.id} path={`items/${item.id}/photos`} onUploaded={async (photos) => { await addItemPhotos(org.id, item.id, user.uid, photos); await refresh(); }} />
      </div>
      <SurfaceCard>
        <h3 className="mb-3 font-bold">Actions</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <ActionTile label="Edit Item" icon={<Edit3 size={17} />} onClick={() => setEditing(!editing)} />
          <ActionTile label="Add Photos" icon={<Camera size={17} />} tone="info" onClick={() => document.getElementById("item-photo-uploader")?.scrollIntoView({ behavior: "smooth" })} />
          <ActionTile label="Mark Listed" icon={<Tag size={17} />} tone="success" onClick={async () => { await updateItemStatus(org.id, item.id, user.uid, "listed"); await refresh(); }} />
          <ActionTile label="Add Listing URL" icon={<LinkIcon size={17} />} tone="primary" onClick={() => setMessage("Use Edit Item to capture listing notes for now. Dedicated listing URLs remain in the MVP backlog.")} />
          <ActionTile label="Generate QR" icon={<QrCode size={17} />} tone="neutral" onClick={() => window.print()} />
          <ActionTile label="Mark Sold" icon={<PackageCheck size={17} />} tone="warning" href="/sell" />
        </div>
        <div className="mt-4"><QRLabel item={item} /></div>
      </SurfaceCard>
      {editing ? (
        <form
          className="app-card grid gap-4 p-4 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            await updateItem(org.id, item.id, user.uid, {
              title: form.title,
              brand: form.brand,
              itemType: form.itemType,
              size: form.size,
              material: form.material,
              costBasisCents: centsFromDecimal(form.costBasis),
              currentListPriceCents: centsFromDecimal(form.listPrice),
              acquiredAt: timestampFromInput(form.acquiredAt)
            });
            setMessage("Item saved.");
            setEditing(false);
            await refresh();
          }}
        >
          <TextField label="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <TextField label="Brand" value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} />
          <TextField label="Type" value={form.itemType} onChange={(event) => setForm({ ...form, itemType: event.target.value })} />
          <TextField label="Size" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
          <TextField label="Material" value={form.material} onChange={(event) => setForm({ ...form, material: event.target.value })} />
          <MoneyInput label="Cost basis" value={form.costBasis} onChange={(event) => setForm({ ...form, costBasis: event.target.value })} />
          <MoneyInput label="List price" value={form.listPrice} onChange={(event) => setForm({ ...form, listPrice: event.target.value })} />
          <DateInput label="Acquired at" value={form.acquiredAt} onChange={(event) => setForm({ ...form, acquiredAt: event.target.value })} />
          <SelectField label="Status" value={item.status} onChange={async (event) => { await updateItemStatus(org.id, item.id, user.uid, event.target.value as Item["status"]); await refresh(); }} options={["draft", "active", "listed", "reserved", "sold", "donated", "lost", "returned"].map((value) => ({ value, label: value }))} />
          <PrimaryButton className="md:col-span-2">Save changes</PrimaryButton>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          <SecondaryButton onClick={async () => { await updateItemStatus(org.id, item.id, user.uid, "donated"); await refresh(); }}><Upload size={16} className="mr-2 inline" />Mark donated</SecondaryButton>
          <SecondaryButton onClick={async () => { await updateItemStatus(org.id, item.id, user.uid, "lost"); await refresh(); }}><Copy size={16} className="mr-2 inline" />Mark lost</SecondaryButton>
          <Link className="tap inline-flex items-center rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white" to="/sell"><CheckCircle size={16} className="mr-2" />Mark sold</Link>
        </div>
      )}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <p className="text-xs text-muted">Last updated {formatISODateTime(item.updatedAt)}</p>
    </div>
  );
};
