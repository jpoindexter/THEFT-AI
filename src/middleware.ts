// No-op middleware in mock-store mode.
// We will re-introduce auth when Supabase is wired in.
import { NextResponse, type NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
