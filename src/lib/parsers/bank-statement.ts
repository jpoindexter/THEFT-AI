export interface Transaction {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

const DATE_PREFIX = /^\d{1,2}\/\d{1,2}\/\d{2,4}/;
// Matches currency values: optional minus, digits with optional commas, decimal
const AMOUNT_PATTERN = /(-?[\d,]+\.\d{2})/g;

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

function extractAmounts(text: string): number[] {
  return [...text.matchAll(AMOUNT_PATTERN)].map((m) => parseAmount(m[1]));
}

function isSkippable(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes("page ") ||
    lower.includes("account number") ||
    lower.includes("statement period") ||
    lower.includes("opening balance") ||
    lower.includes("closing balance") ||
    lower.includes("total deposits") ||
    lower.includes("total withdrawals") ||
    lower.includes("beginning balance") ||
    lower.includes("ending balance") ||
    // Header row
    /date\s+description/i.test(line)
  );
}

export function parseTransactions(text: string): Transaction[] {
  const transactions: Transaction[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || !DATE_PREFIX.test(line)) continue;
    if (isSkippable(line)) continue;

    const amounts = extractAmounts(line);
    if (amounts.length === 0) continue;

    const dateMatch = line.match(/^(\d{1,2}\/\d{1,2}\/\d{2,4})/);
    if (!dateMatch) continue;
    const date = dateMatch[1];

    const afterDate = line.slice(date.length).trim();
    // Description is everything before the first currency amount
    const firstAmountIdx = afterDate.search(AMOUNT_PATTERN);
    const description =
      firstAmountIdx > 0
        ? afterDate.slice(0, firstAmountIdx).trim()
        : afterDate;

    // Last amount is balance, second-to-last is the transaction amount
    const balance = amounts.length >= 1 ? amounts[amounts.length - 1] : null;
    const rawAmount = amounts.length >= 2 ? amounts[amounts.length - 2] : null;

    const debit =
      rawAmount !== null && rawAmount < 0 ? Math.abs(rawAmount) : null;
    const credit = rawAmount !== null && rawAmount >= 0 ? rawAmount : null;

    transactions.push({ date, description, debit, credit, balance });
  }

  return transactions;
}
