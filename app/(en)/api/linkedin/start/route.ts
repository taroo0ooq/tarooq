import { NextResponse } from "next/server";
import { NEXT_COOKIE, STATE_COOKIE, authorReturnPath, authorizationUrl, isRegisteredOrigin, newState, siteOrigin, unregisteredOriginMessage } from "@/lib/linkedin";

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
    return plain(400, unregisteredOriginMessage());
  }
  if (!process.env.LINKEDIN_CLIENT_SECRET) {
    return plain(500, "LINKEDIN_CLIENT_SECRET is not set.");
  }

  const nextPath = authorReturnPath(new URL(request.url).searchParams.get("next"));
  const state = newState();
  const response = NextResponse.redirect(authorizationUrl(origin, state));
  const secure = origin.startsWith("https://");
  response.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 600,
  });
  response.cookies.set({
    name: NEXT_COOKIE,
    value: nextPath,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: nextPath ? 600 : 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
