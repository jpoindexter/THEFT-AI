import { NextResponse } from "next/server";

type Bucket = {
  timestamp: string;
  total: number;
  success: number;
  error: number;
  building: number;
};

function generateBuckets(minutes: number): Bucket[] {
  const now = new Date();
  now.setSeconds(0, 0);
  return Array.from({ length: minutes }, (_, i) => {
    const ts = new Date(now.getTime() - (minutes - 1 - i) * 60_000);
    const isSpike = i === 17;
    return {
      timestamp: ts.toISOString(),
      total: isSpike ? 1 : 0,
      success: isSpike ? 1 : 0,
      error: 0,
      building: 0,
    };
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ org: string }> }
) {
  await params;
  const url = new URL(request.url);
  const minutes = Math.min(
    parseInt(url.searchParams.get("time_range_minutes") ?? "60", 10),
    1440
  );
  const buckets = generateBuckets(minutes);
  return NextResponse.json({
    buckets,
    is_connected: true,
    total_deployments: buckets.filter((b) => b.total > 0).length,
    time_range_minutes: minutes,
  });
}
