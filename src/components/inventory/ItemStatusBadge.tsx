import type { ItemStatus } from "../../types/domain";
import { Pill } from "../common/ui";

const tones: Record<ItemStatus, "neutral" | "success" | "warning" | "danger" | "primary"> = {
  draft: "neutral",
  active: "success",
  listed: "primary",
  reserved: "warning",
  sold: "primary",
  donated: "neutral",
  lost: "danger",
  returned: "warning"
};

export const ItemStatusBadge = ({ status }: { status: ItemStatus }) => <Pill tone={tones[status]}>{status.replaceAll("_", " ")}</Pill>;
