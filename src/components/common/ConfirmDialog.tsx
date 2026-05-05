export const ConfirmDialog = ({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4">
    <div className="max-w-sm rounded-lg bg-white p-4 shadow-xl">
      <p className="text-sm">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="tap rounded-md border px-4 text-sm" onClick={onCancel}>Cancel</button>
        <button className="tap rounded-md bg-ink px-4 text-sm text-white" onClick={onConfirm}>Confirm</button>
      </div>
    </div>
  </div>
);
