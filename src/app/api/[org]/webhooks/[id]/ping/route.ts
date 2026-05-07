import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db/store";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const items = await db.listWebhooks(o.id);
  const wh = items.find((w) => w.id === id);
  if (!wh)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const payload = JSON.stringify({
    type: "ping",
    workspace: org,
    sent_at: new Date().toISOString(),
  });
  const signature = createHmac("sha256", wh.secret)
    .update(payload)
    .digest("hex");

  let status = 0;
  try {
    const res = await fetch(wh.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-THEFT-Signature": signature,
        "X-THEFT-Event": "ping",
      },
      body: payload,
      signal: AbortSignal.timeout(5000),
    });
    status = res.status;
  } catch {
    status = 0;
  }

  const ok = status >= 200 && status < 300;
  await db.updateWebhook(id, {
    status: ok ? "ok" : "failing",
    last_delivery_at: new Date().toISOString(),
    last_status_code: status,
    success_count: wh.success_count + (ok ? 1 : 0),
    failure_count: wh.failure_count + (ok ? 0 : 1),
  });

  return NextResponse.json({ ok, status });
}
