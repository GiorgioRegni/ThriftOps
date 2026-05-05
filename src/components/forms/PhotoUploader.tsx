import { useState } from "react";
import type { ItemPhoto, PhotoKind } from "../../types/domain";
import { uploadOrgImage } from "../../services/storageService";

export const PhotoUploader = ({ orgId, path, onUploaded, kind = "other" }: { orgId: string; path: string; kind?: PhotoKind; onUploaded: (photos: ItemPhoto[]) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  return (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-white p-4 shadow-card">
      <span className="block text-sm font-semibold">Photos</span>
      <span className="mt-1 block text-xs text-muted">Use camera or select files. Images upload to Firebase Storage.</span>
      <input
        className="mt-3 block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-700"
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        disabled={uploading}
        onChange={async (event) => {
          const files = [...(event.currentTarget.files ?? [])];
          if (!files.length) return;
          setUploading(true);
          setError("");
          try {
            const photos = await Promise.all(files.map((file) => uploadOrgImage(orgId, path, file, kind)));
            onUploaded(photos);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setUploading(false);
          }
        }}
      />
      {uploading ? <p className="mt-2 text-sm text-muted">Uploading...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </label>
  );
};
