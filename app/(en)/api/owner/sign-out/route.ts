import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/linkedin";
import { OWNER_COOKIE } from "@/lib/owner-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function POST(request: Request) {
  const origin = siteOrigin(request);
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  response.cookies.set({
    name: OWNER_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 0,
  });
  return response;
}
