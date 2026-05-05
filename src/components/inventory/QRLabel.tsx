import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { Item } from "../../types/domain";

export const QRLabel = ({ item }: { item: Item }) => {
  const [url, setUrl] = useState("");
  useEffect(() => {
    void QRCode.toDataURL(`thriftops:item:${item.itemCode}`, { width: 160, margin: 1 }).then(setUrl);
  }, [item.itemCode]);
  return (
    <div className="inline-flex items-center gap-3 rounded-md border bg-white p-3">
      {url ? <img className="h-24 w-24" src={url} alt={`QR code for ${item.itemCode}`} /> : null}
      <div>
        <p className="font-bold">{item.itemCode}</p>
        <p className="text-sm">{item.brand}</p>
        <p className="text-xs text-muted">{item.title.slice(0, 48)}</p>
      </div>
    </div>
  );
};
