import ExcelJS from "exceljs";
import type { Transaction } from "@/lib/parsers/bank-statement";

export async function buildExcel(transactions: Transaction[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Transactions");

  ws.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Description", key: "description", width: 40 },
    { header: "Debit", key: "debit", width: 14 },
    { header: "Credit", key: "credit", width: 14 },
    { header: "Balance", key: "balance", width: 16 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };

  for (const tx of transactions) {
    ws.addRow({
      date: tx.date,
      description: tx.description,
      debit: tx.debit ?? "",
      credit: tx.credit ?? "",
      balance: tx.balance ?? "",
    });
  }

  // Auto-width based on actual content
  ws.columns.forEach((col) => {
    let maxLen = String(col.header ?? "").length;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 2, 60);
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
