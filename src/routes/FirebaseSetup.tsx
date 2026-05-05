import { missingFirebaseEnv } from "../lib/firebase";

export const FirebaseSetup = () => (
  <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
    <section className="w-full max-w-xl rounded-lg border bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-semibold">Firebase config needed</h1>
      <p className="mt-2 text-sm text-muted">
        The app loaded, but Firebase env vars are missing. Add a real Firebase web app config to `.env`, or enable emulators for local-only testing.
      </p>
      <div className="mt-4 rounded-md bg-slate-100 p-3">
        <p className="text-sm font-medium">Missing values</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-muted">
          {missingFirebaseEnv.map((key) => <li key={key}>{key}</li>)}
        </ul>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <p className="font-medium">Option A: use Firebase emulators</p>
        <pre className="overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-white">{`# in .env
VITE_USE_FIREBASE_EMULATORS=true

# terminal 1
npm run firebase:emulators

# terminal 2
npm run dev`}</pre>
        <p className="text-muted">Default emulator ports are Auth 17099, Firestore 17080, Firestore websocket 17150, Storage 17199, Hosting 17000, UI 17400, Hub 17440, and Logging 17450.</p>
        <p className="font-medium">Option B: use a real Firebase project</p>
        <p className="text-muted">Fill the `VITE_FIREBASE_*` values in `.env`, then restart `npm run dev`.</p>
      </div>
    </section>
  </main>
);
