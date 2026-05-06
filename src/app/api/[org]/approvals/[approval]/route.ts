import { NextResponse } from "next/server";

const VALID = ["approve", "decline", "discuss"] as const;

type Decision = (typeof VALID)[number];

function isDecision(v: unknown): v is Decision {
  return typeof v === "string" && (VALID as readonly string[]).includes(v);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string; approval: string }> },
) {
  const { org, approval } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const decision = (body as { decision?: unknown })?.decision;
  if (!isDecision(decision)) {
    return NextResponse.json(
      { error: "decision must be approve | decline | discuss" },
      { status: 400 },
    );
  }
  return NextResponse.json({
    ok: true,
    org,
    approval,
    decision,
    at: new Date().toISOString(),
  });
}
