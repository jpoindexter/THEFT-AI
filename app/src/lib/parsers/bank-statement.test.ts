import { describe, it, expect } from "vitest";
import { parseTransactions } from "./bank-statement";

// Standard format: date  description  negative-amount  balance
const FIXTURE_STANDARD = `
CHASE BANK MONTHLY STATEMENT
Account Number: ****1234
Statement Period: 01/01/2024 - 01/31/2024
Opening Balance: 1,000.00

01/05/2024  AMAZON.COM PURCHASE  -45.99  954.01
01/10/2024  PAYROLL DIRECT DEP  2,500.00  3,454.01
01/15/2024  NETFLIX SUBSCRIPTION  -15.99  3,438.02
01/20/2024  ATM WITHDRAWAL  -200.00  3,238.02

Closing Balance: 3,238.02
Page 1 of 1
`;

// BoA-style: date  description  amount  balance (positive = debit listed as positive, no sign)
// The parser uses sign: negative → debit, positive → credit
const FIXTURE_BOA_STYLE = `
Date        Description                Amount      Balance
01/22/2024  WHOLE FOODS MARKET         -87.43      5,412.57
01/23/2024  EMPLOYER PAYROLL           3,200.00    8,612.57
01/24/2024  ELECTRIC BILL PMT          -124.00     8,488.57
`;

// Lines that should all be skipped (no transactions extracted)
const FIXTURE_NO_TRANSACTIONS = `
WELLS FARGO BANK
Account Number: XXXX-5678
Statement Period: February 1 - February 28, 2024
Opening Balance: $2,500.00
Closing Balance: $3,100.00
Total Deposits: $1,000.00
Total Withdrawals: $400.00
Date    Description    Amount    Balance
Page 2 of 5
`;

describe("parseTransactions", () => {
  it("extracts transactions from a standard chase-style statement", () => {
    const result = parseTransactions(FIXTURE_STANDARD);
    expect(result).toHaveLength(4);

    expect(result[0]).toMatchObject({
      date: "01/05/2024",
      description: "AMAZON.COM PURCHASE",
      debit: 45.99,
      credit: null,
      balance: 954.01,
    });

    expect(result[1]).toMatchObject({
      date: "01/10/2024",
      description: "PAYROLL DIRECT DEP",
      debit: null,
      credit: 2500,
      balance: 3454.01,
    });

    expect(result[2]).toMatchObject({
      date: "01/15/2024",
      description: "NETFLIX SUBSCRIPTION",
      debit: 15.99,
      credit: null,
    });

    expect(result[3]).toMatchObject({
      date: "01/20/2024",
      description: "ATM WITHDRAWAL",
      debit: 200,
      credit: null,
      balance: 3238.02,
    });
  });

  it("extracts transactions from a BoA-style statement", () => {
    const result = parseTransactions(FIXTURE_BOA_STYLE);
    expect(result).toHaveLength(3);

    expect(result[0]).toMatchObject({
      date: "01/22/2024",
      debit: 87.43,
      credit: null,
      balance: 5412.57,
    });

    expect(result[1]).toMatchObject({
      date: "01/23/2024",
      debit: null,
      credit: 3200,
      balance: 8612.57,
    });

    expect(result[2]).toMatchObject({
      date: "01/24/2024",
      debit: 124,
      credit: null,
      balance: 8488.57,
    });
  });

  it("returns empty array for non-transaction content", () => {
    const result = parseTransactions(FIXTURE_NO_TRANSACTIONS);
    expect(result).toHaveLength(0);
  });
});
