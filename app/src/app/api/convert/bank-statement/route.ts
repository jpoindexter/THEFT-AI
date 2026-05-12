import { PDFParse } from "pdf-parse";
import { parseTransactions } from "@/lib/parsers/bank-statement";
import { buildExcel } from "@/lib/excel/bank-statement";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
    return Response.json(
      { error: "File exceeds the 10 MB limit." },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid multipart form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No PDF file provided." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return Response.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "File exceeds the 10 MB limit." },
      { status: 413 },
    );
  }

  let pdfText: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const parser = new PDFParse({ data: arrayBuffer });
    const result = await parser.getText();
    await parser.destroy();
    pdfText = result.text;
  } catch {
    return Response.json(
      { error: "Could not read the PDF. Make sure it is a valid, non-encrypted PDF." },
      { status: 422 },
    );
  }

  const transactions = parseTransactions(pdfText);
  if (transactions.length === 0) {
    return Response.json(
      { error: "No transactions found. Make sure this is a bank statement PDF with recognisable date-prefixed rows." },
      { status: 422 },
    );
  }

  const xlsx = await buildExcel(transactions);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(xlsx), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="transactions-${date}.xlsx"`,
    },
  });
}
