import * as XLSX from "xlsx";

export const readWorkbook = async (file: File): Promise<XLSX.WorkBook> => {
  const buffer = await file.arrayBuffer();
  return XLSX.read(buffer, { type: "array", cellDates: true });
};

export const rowsFromSheet = (workbook: XLSX.WorkBook, sheetName: string): Record<string, unknown>[] => {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : [];
};

export const downloadWorkbook = (filename: string, sheets: Record<string, Record<string, unknown>[]>): void => {
  const workbook = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name.slice(0, 31));
  });
  XLSX.writeFile(workbook, filename);
};
