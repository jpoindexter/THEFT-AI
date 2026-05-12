import { NextResponse } from "next/server";

const SERIES = [3, 8, 5, 12, 18, 14, 22, 30, 28, 36, 41, 38, 47, 52];

const PER_AGENT = [
  { agent: "Engineer", model: "claude-opus-4-7", spent: 142.5 },
  { agent: "Marketing", model: "claude-sonnet-4-6", spent: 38.2 },
  { agent: "Design", model: "claude-opus-4-7", spent: 76.4 },
  { agent: "Sales", model: "claude-sonnet-4-6", spent: 12.0 },
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const lines: string[] = [];
  lines.push("kind,bucket,value");
  SERIES.forEach((v, i) =>
    lines.push(`daily,day_${i + 1},${v.toFixed(2)}`),
  );
  PER_AGENT.forEach((r) =>
    lines.push(`agent,${r.agent}|${r.model},${r.spent.toFixed(2)}`),
  );
  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv",
      "content-disposition": `attachment; filename="${org}-costs.csv"`,
    },
  });
}
