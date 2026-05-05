import type { Category } from "../types/domain";

const prefixes: Record<Category, string> = {
  women: "W",
  kids: "K",
  home_goods: "H",
  uncategorized: "U"
};

export const prefixForCategory = (category: Category): string => prefixes[category];

export const generateItemCode = (category: Category, sequence: number, date = new Date()): string => {
  const year = date.getFullYear();
  return `${prefixForCategory(category)}-${year}-${String(sequence).padStart(6, "0")}`;
};

export const nextSequenceFromCodes = (codes: string[], category: Category, date = new Date()): number => {
  const prefix = `${prefixForCategory(category)}-${date.getFullYear()}-`;
  const max = codes
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number.parseInt(code.slice(prefix.length), 10))
    .filter(Number.isFinite)
    .reduce((largest, value) => Math.max(largest, value), 0);
  return max + 1;
};
