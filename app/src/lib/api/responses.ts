import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function err(
  status: number,
  code: string,
  message?: string,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error: code, ...(message ? { message } : {}), ...(extra ?? {}) },
    { status },
  );
}

export function notFound(what = "resource"): NextResponse {
  return err(404, "not_found", `${what} not found`);
}

export function invalidInput(zerr: ZodError): NextResponse {
  return err(400, "invalid_input", "Invalid request body", { issues: zerr.issues });
}
