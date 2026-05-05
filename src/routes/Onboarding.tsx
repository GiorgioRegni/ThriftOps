import { useState } from "react";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { TextField } from "../components/forms/TextField";
import { Loading } from "../components/common/Loading";
import { useAuth } from "../hooks/useAuth";
import { useOrg } from "../hooks/useOrg";
import { createOrg, joinOrg } from "../services/orgService";

const schema = z.object({ name: z.string().min(2), homeState: z.string().min(2), defaultSalesTaxRateBps: z.coerce.number().min(0).optional(), trackSalesTax: z.boolean() });
const joinSchema = z.object({ orgId: z.string().trim().min(8, "Enter the existing organization ID.") });

export const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { org, loading: orgLoading, error: orgError, refreshOrgs } = useOrg();
  const [mode, setMode] = useState<"join" | "create">("join");
  const [form, setForm] = useState({ name: "", homeState: "", defaultSalesTaxRateBps: 0, trackSalesTax: false });
  const [joinForm, setJoinForm] = useState({ orgId: "" });
  const [error, setError] = useState("");
  if (authLoading || orgLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (org) return <Navigate to="/" replace />;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form
        className="w-full max-w-md rounded-lg border bg-white p-5 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          if (mode === "join") {
            const parsed = joinSchema.safeParse(joinForm);
            if (!parsed.success) {
              setError(parsed.error.issues[0]?.message ?? "Check your form.");
              return;
            }
            try {
              await joinOrg(parsed.data.orgId);
              await refreshOrgs();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Unable to join org.");
            }
            return;
          }

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
        <h1 className="text-xl font-semibold">Join your resale workspace</h1>
        {orgError ? <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{orgError}</p> : null}
        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button type="button" className={`tap rounded-lg ${mode === "join" ? "bg-white text-ink shadow-sm" : "text-muted"}`} onClick={() => { setMode("join"); setError(""); }}>Join existing</button>
          <button type="button" className={`tap rounded-lg ${mode === "create" ? "bg-white text-ink shadow-sm" : "text-muted"}`} onClick={() => { setMode("create"); setError(""); }}>Create new</button>
        </div>
        {mode === "join" ? (
          <div className="mt-5 space-y-4">
            <TextField label="Organization ID" value={joinForm.orgId} onChange={(event) => setJoinForm({ orgId: event.target.value })} />
            <p className="text-sm text-muted">Ask an existing workspace owner to copy this from Settings.</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <TextField label="Business name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <TextField label="Home state" value={form.homeState} onChange={(event) => setForm({ ...form, homeState: event.target.value })} />
            <TextField label="Default sales tax rate bps" type="number" value={form.defaultSalesTaxRateBps} onChange={(event) => setForm({ ...form, defaultSalesTaxRateBps: Number(event.target.value) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.trackSalesTax} onChange={(event) => setForm({ ...form, trackSalesTax: event.target.checked })} />
              Track sales tax
            </label>
          </div>
        )}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button className="tap mt-5 w-full rounded-md bg-ink px-4 font-medium text-white">{mode === "join" ? "Join org" : "Create org"}</button>
      </form>
    </main>
  );
};
