import { useState } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { TextField } from "../components/forms/TextField";
import { Loading } from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { createOrg } from "../services/orgService";

const schema = z.object({ name: z.string().min(2), homeState: z.string().min(2), defaultSalesTaxRateBps: z.coerce.number().min(0).optional(), trackSalesTax: z.boolean() });

export const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { org, refreshOrgs } = useOrg();
  const [form, setForm] = useState({ name: "", homeState: "", defaultSalesTaxRateBps: 0, trackSalesTax: false });
  const [error, setError] = useState("");
  if (authLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (org) return <Navigate to="/" replace />;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form
        className="w-full max-w-md rounded-lg border bg-white p-5 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          const parsed = schema.safeParse(form);
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Check your form.");
            return;
          }
          try {
            await createOrg(user.uid, user.email ?? "", user.displayName ?? "", parsed.data);
            await refreshOrgs();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Unable to create org.");
          }
        }}
      >
        <h1 className="text-xl font-semibold">Create your resale workspace</h1>
        <div className="mt-5 space-y-4">
          <TextField label="Business name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextField label="Home state" value={form.homeState} onChange={(event) => setForm({ ...form, homeState: event.target.value })} />
          <TextField label="Default sales tax rate bps" type="number" value={form.defaultSalesTaxRateBps} onChange={(event) => setForm({ ...form, defaultSalesTaxRateBps: Number(event.target.value) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.trackSalesTax} onChange={(event) => setForm({ ...form, trackSalesTax: event.target.checked })} />
            Track sales tax
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button className="tap mt-5 w-full rounded-md bg-ink px-4 font-medium text-white">Create org</button>
      </form>
    </main>
  );
};
