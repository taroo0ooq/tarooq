import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/posts/new", request.url), 307);
}
