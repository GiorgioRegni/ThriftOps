import Papa from "papaparse";

export const toCsv = <T extends Record<string, unknown>>(rows: T[]): string => Papa.unparse(rows);

export const downloadTextFile = (filename: string, content: string, type = "text/csv;charset=utf-8;"): void => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
