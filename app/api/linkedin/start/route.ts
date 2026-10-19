import { NextResponse } from "next/server";
import { STATE_COOKIE, authorizationUrl, isRegisteredOrigin, newState, siteOrigin } from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function plain(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export function GET(request: Request) {
  const origin = siteOrigin(request);
  if (!isRegisteredOrigin(origin)) {
    return plain(400, "This host is not a registered LinkedIn redirect. Use https://tarooq.vercel.app or http://localhost:3000.");
  }
  if (!process.env.LINKEDIN_CLIENT_SECRET) {
    return plain(500, "LINKEDIN_CLIENT_SECRET is not set.");
  }

  const state = newState();
  const response = NextResponse.redirect(authorizationUrl(origin, state));
  response.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
