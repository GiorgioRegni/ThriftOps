import { useState } from "react";
import { readWorkbook } from "../lib/excel";
import { buildImportPreview, type ImportPreview } from "../services/importService";
import { createItem } from "../services/itemService";
import { createPayment } from "../services/paymentService";
import { createExpense } from "../services/expenseService";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import type { Category, Condition, ExpenseCategory, PaymentSource } from "../types/domain";

export const Imports = () => {
  const { org } = useOrg();
  const { user } = useAuth();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [message, setMessage] = useState("");
  if (!org || !user) return null;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Imports</h2>
      <section className="rounded-lg border bg-white p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Upload Excel workbook</span>
          <input type="file" accept=".xlsx,.xls" onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            if (!file) return;
            const workbook = await readWorkbook(file);
            setPreview(buildImportPreview(workbook, file.name));
          }} />
        </label>
      </section>
      {preview ? (
        <section className="space-y-3 rounded-lg border bg-white p-4">
          <div>
            <p className="font-semibold">{preview.workbookName}</p>
            <p className="text-sm text-muted">Detected sheets: {preview.detectedSheets.join(", ")}</p>
            <p className="text-sm text-muted">Rows proposed: {preview.rowCount}</p>
          </div>
          <div className="max-h-96 overflow-auto rounded-md border">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="p-2">Type</th><th className="p-2">Sheet</th><th className="p-2">Proposed</th><th className="p-2">Warnings</th></tr></thead>
              <tbody>
                {preview.records.map((record) => <tr key={record.id} className="border-t"><td className="p-2">{record.type}</td><td className="p-2">{record.sheetName}</td><td className="max-w-md truncate p-2">{JSON.stringify(record.proposed)}</td><td className="p-2">{record.reviewFlags.join(", ")}</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button className="tap rounded-md bg-ink px-4 text-white" onClick={async () => {
              for (const record of preview.records) {
                if (record.type === "item") {
                  const p = record.proposed;
                  await createItem(org.id, user.uid, {
                    itemCode: String(p.itemCode ?? ""),
                    category: (p.category ?? "uncategorized") as Category,
                    status: (p.status ?? "active") as "active",
                    brand: String(p.brand ?? ""),
                    itemType: String(p.itemType ?? ""),
                    title: String(p.title ?? "Imported item"),
                    description: "",
                    size: String(p.size ?? ""),
                    material: "",
                    color: "",
                    condition: "unknown" as Condition,
                    measurements: { unit: "in" },
                    costBasisCents: Number(p.costBasisCents ?? 0),
                    acquiredAt: new Date().toISOString(),
                    sourceVendor: "Imported",
                    sourceLocation: "",
                    storageLocation: "",
                    currentListPriceCents: Number(p.currentListPriceCents ?? 0),
                    notes: "",
                    reviewFlags: record.reviewFlags
                  });
                }
                if (record.type === "payment") {
                  await createPayment(org.id, {
                    date: new Date().toISOString(),
                    source: (record.proposed.source ?? "other") as PaymentSource,
                    amountCents: Number(record.proposed.amountCents ?? 0),
                    note: String(record.proposed.note ?? ""),
                    importedFrom: preview.workbookName
                  });
                }
                if (record.type === "expense") {
                  await createExpense(org.id, user.uid, {
                    date: new Date().toISOString(),
                    category: (record.proposed.category ?? "other") as ExpenseCategory,
                    vendor: String(record.proposed.vendor ?? "Imported"),
                    amountCents: Number(record.proposed.amountCents ?? 0),
                    paymentMethod: "",
                    taxDeductible: true,
                    notes: String(record.proposed.notes ?? "")
                  });
                }
              }
              setMessage("Import confirmed and written to Supabase.");
              setPreview(null);
            }}>Confirm import</button>
            <button className="tap rounded-md border px-4" onClick={() => setPreview(null)}>Cancel import</button>
          </div>
        </section>
      ) : null}
      {message ? <p className="rounded-md bg-white p-3 text-sm">{message}</p> : null}
    </div>
  );
};
