import { NextResponse } from "next/server";
import { storeOwnerLinkedInToken } from "@/lib/linkedin-connection";
import {
  NEXT_COOKIE,
  STATE_COOKIE,
  exchangeCode,
  fetchMember,
  isRegisteredOrigin,
  siteOrigin,
  statesMatch,
  unregisteredOriginMessage,
} from "@/lib/linkedin";
import { OWNER_COOKIE, SESSION_SECONDS, isOwner, sealOwnerSession } from "@/lib/owner-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function page(status: number, message: string) {
  const body = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LinkedIn</title>
<body style="margin:0;background:#f8f7fc;color:#0b1f3a;font-family:Georgia,serif;padding:48px 6vw;">
<p>${escapeHtml(message)}</p>
<p><a href="/api/linkedin/start">Connect again</a></p>`;
  return new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function finish(response: NextResponse, secure: boolean) {
  response.cookies.set({ name: STATE_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0 });
  response.cookies.set({ name: NEXT_COOKIE, value: "", httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  if (error) {
    const code = /^[A-Za-z0-9_]+$/.test(error) ? error : "an error";
    return page(400, `LinkedIn returned ${code}.`);
  }

  const origin = siteOrigin(request);
  if (!isRegisteredOrigin(origin)) {
    return page(400, unregisteredOriginMessage());
  }

  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  const cookie = readCookie(request, STATE_COOKIE);
  if (!code || !state || !cookie || !statesMatch(state, cookie)) {
    return page(400, "This LinkedIn callback needs a valid code. Nothing was saved.");
  }
  if (!process.env.LINKEDIN_CLIENT_SECRET) {
    return page(500, "LINKEDIN_CLIENT_SECRET is not set.");
  }

  try {
    const exchanged = await exchangeCode(origin, code);
    const member = await fetchMember(exchanged.accessToken);
    const secure = origin.startsWith("https://");
    if (!process.env.LINKEDIN_PERSON_ID) {
      return finish(page(500, "LINKEDIN_PERSON_ID is not set."), secure);
    }
    if (!isOwner(member.personId)) {
      return finish(page(403, "This LinkedIn account cannot author posts."), secure);
    }

    const expiresAt = new Date(Date.now() + Math.max(0, exchanged.expiresIn) * 1000).toISOString();
    let stored = false;
    try {
      await storeOwnerLinkedInToken({
        accessToken: exchanged.accessToken,
        expiresAt,
        personId: member.personId,
        name: member.name,
        email: member.email,
      });
      stored = true;
    } catch {
      stored = false;
    }

    const response = NextResponse.redirect(new URL(stored ? "/posts/new?linkedin=connected" : "/posts/new?linkedin=unsaved", origin), 303);
    response.cookies.set({
      name: OWNER_COOKIE,
      value: sealOwnerSession(member.personId),
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: SESSION_SECONDS,
    });
    return finish(response, secure);
  } catch (error) {
    const message = error instanceof Error ? error.message : "LinkedIn sign-in failed.";
    return page(400, message);
  }
}
