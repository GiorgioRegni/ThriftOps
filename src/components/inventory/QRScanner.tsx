import { BrowserQRCodeReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";

export const QRScanner = ({ onScan }: { onScan: (value: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const reader = new BrowserQRCodeReader();
    let stopped = false;
    let controls: { stop: () => void } | undefined;
    if (videoRef.current) {
      reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (result && !stopped) onScan(result.getText());
      }).then((nextControls) => {
        controls = nextControls;
      }).catch((err) => setError(err instanceof Error ? err.message : "Camera unavailable."));
    }
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onScan]);
  return (
    <div className="rounded-lg border bg-white p-3">
      <video ref={videoRef} className="aspect-video w-full rounded-md bg-slate-100" muted />
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : <p className="mt-2 text-xs text-muted">Camera scanning may require HTTPS or localhost.</p>}
    </div>
  );
};
