export const centsFromDecimal = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = String(value).replace(/[$,\s]/g, "");
  if (!normalized || normalized === "-") return 0;
  const negative = normalized.startsWith("-");
  const unsigned = negative ? normalized.slice(1) : normalized;
  const [dollarsRaw, centsRaw = ""] = unsigned.split(".");
  const dollars = Number.parseInt(dollarsRaw || "0", 10);
  const cents = Number.parseInt(centsRaw.padEnd(2, "0").slice(0, 2) || "0", 10);
  const total = dollars * 100 + cents;
  return negative ? -total : total;
};

export const formatMoney = (cents: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);

export const centsToInput = (cents?: number): string => (cents ? (cents / 100).toFixed(2) : "");
