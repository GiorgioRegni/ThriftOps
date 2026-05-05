import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { TextField } from "../components/forms/TextField";
import { signInWithEmail, signUpWithEmail } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

const schema = z.object({ email: z.string().email(), password: z.string().min(6), displayName: z.string().optional() });

export const Login = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  if (user) return <Navigate to={(location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/"} replace />;
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <form
        className="w-full max-w-sm rounded-lg border bg-white p-5 shadow-sm"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          const parsed = schema.safeParse(form);
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message ?? "Check your form.");
            return;
          }
          try {
            if (mode === "signup") await signUpWithEmail(form.email, form.password, form.displayName);
            else await signInWithEmail(form.email, form.password);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed.");
          }
        }}
      >
        <h1 className="text-2xl font-semibold">thriftops</h1>
        <p className="mt-1 text-sm text-muted">Private resale inventory and bookkeeping.</p>
        <div className="mt-5 space-y-4">
          {mode === "signup" ? <TextField label="Display name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /> : null}
          <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button className="tap mt-5 w-full rounded-md bg-ink px-4 font-medium text-white">{mode === "signup" ? "Create account" : "Sign in"}</button>
        <button type="button" className="tap mt-2 w-full rounded-md border px-4 text-sm" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
          {mode === "signup" ? "Sign in instead" : "Create an account"}
        </button>
      </form>
    </main>
  );
};
