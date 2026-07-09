/**
 * Reusable export utilities for the Reports module.
 *
 * `toCsv` is fully implemented and dependency-free — it is used as soon as
 * any report starts returning tabular data. `toExcelBuffer` and `toPdfBuffer`
 * are intentionally left as stubs: Phase 1 scaffolds the shape reports will
 * call, but wiring in a real XLSX/PDF library is Phase 2 work so we don't
 * pull in heavy dependencies before there is real report data to export.
 */

export class NotImplementedError extends Error {
  constructor(feature: string) {
    super(`${feature} export is not implemented yet`);
    this.name = "NotImplementedError";
  }
}

/** Generic tabular shape shared by all export formats. */
export interface ExportTable {
  headers: string[];
  rows: (string | number | null)[][];
}

function csvEscape(value: string | number | null): string {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Serializes a table to CSV text. Ready for use by any report today. */
export function toCsv(table: ExportTable): string {
  const lines = [
    table.headers.map(csvEscape).join(","),
    ...table.rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return lines.join("\n");
}

/**
 * Placeholder for XLSX export. Phase 2 should implement this using a
 * workbook library (e.g. exceljs) and return a Buffer of the .xlsx file.
 */
export function toExcelBuffer(_table: ExportTable): Buffer {
  throw new NotImplementedError("Excel");
}

/**
 * Placeholder for PDF export. Phase 2 should implement this using a PDF
 * library (e.g. pdfkit) and return a Buffer of the .pdf file.
 */
export function toPdfBuffer(_table: ExportTable): Buffer {
  throw new NotImplementedError("PDF");
}
