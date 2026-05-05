import { useState } from "react";
import { TextField } from "../components/forms/TextField";
import { useOrg } from "../hooks/useOrg";
import { updateOrgSettings } from "../services/orgService";

export const Settings = () => {
  const { org, refreshOrgs } = useOrg();
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: org?.name ?? "", homeState: org?.taxSettings.homeState ?? "", trackSalesTax: org?.taxSettings.trackSalesTax ?? false, defaultSalesTaxRateBps: org?.taxSettings.defaultSalesTaxRateBps ?? 0 });
  if (!org) return null;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <form className="space-y-4 rounded-lg border bg-white p-4" onSubmit={async (event) => {
        event.preventDefault();
        await updateOrgSettings(org.id, form);
        await refreshOrgs();
        setMessage("Settings saved.");
      }}>
        <TextField label="Org name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <TextField label="Default state" value={form.homeState} onChange={(event) => setForm({ ...form, homeState: event.target.value })} />
        <TextField label="Default sales tax rate bps" type="number" value={form.defaultSalesTaxRateBps} onChange={(event) => setForm({ ...form, defaultSalesTaxRateBps: Number(event.target.value) })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.trackSalesTax} onChange={(event) => setForm({ ...form, trackSalesTax: event.target.checked })} /> Track sales tax</label>
        <section className="rounded-md bg-slate-50 p-3 text-sm">
          <p className="font-medium">Item ID prefixes</p>
          <p className="text-muted">Women W, Kids K, Home goods H, Uncategorized U. Prefix customization is reserved for the next iteration.</p>
        </section>
        <section className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
          <p className="font-medium text-red-800">Danger zone</p>
          <p className="text-red-700">Data deletion tools are intentionally not implemented in the MVP.</p>
        </section>
        <button className="tap rounded-md bg-ink px-4 text-white">Save settings</button>
      </form>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </div>
  );
};
