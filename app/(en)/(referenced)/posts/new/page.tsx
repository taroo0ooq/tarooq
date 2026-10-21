import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Readex_Pro } from "next/font/google";
import { OwnerDesk } from "@/components/OwnerDesk";
import { AUTHOR_PATH } from "@/lib/linkedin";
import { listOwnerPosts } from "@/lib/owner-route";
import { OWNER_COOKIE, openOwnerSession } from "@/lib/owner-session";
import { promoteDuePosts } from "@/lib/owner-actions";
import { postsDbFromEnv } from "@/lib/supabase-posts";
import { redactSecrets } from "@/lib/secrets";
import { siteUrl } from "@/lib/site";

const arabic = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
  variable: "--font-arabic",
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Desk",
  robots: { index: false, follow: false },
};

export default async function NewPostPage({ searchParams }: { searchParams: Promise<{ linkedin?: string }> }) {
  const [{ linkedin }, jar] = await Promise.all([searchParams, cookies()]);
  const session = openOwnerSession(jar.get(OWNER_COOKIE)?.value ?? "");
  const notice = linkedin === "connected"
    ? "LinkedIn is connected. The token is stored on the server, not in the browser."
    : linkedin === "unsaved"
      ? "You are signed in, but the LinkedIn token was not stored. Check Supabase, then connect again."
      : "";

  let posts: Awaited<ReturnType<typeof listOwnerPosts>>["posts"] = [];
  let connection = { connected: false, expired: false, unreadable: false, expiresAt: null as string | null, name: "" };
  let loadError = "";
  if (session) {
    const db = postsDbFromEnv();
    if (!db) {
      loadError = "Supabase is not configured on this server.";
    } else {
      try {
        await promoteDuePosts(db, {
          now: new Date(),
          origin: siteUrl,
          supabaseUrl: process.env.SUPABASE_URL || "",
        });
        const loaded = await listOwnerPosts();
        posts = loaded.posts;
        connection = loaded.linkedin;
        loadError = loaded.error;
      } catch (error) {
        loadError = redactSecrets(error instanceof Error ? error.message : "Could not load posts.");
      }
    }
  }

  return (
    <main className={`page ${arabic.variable}`}>
      <header className="page-head desk-head">
        <p className="eyebrow">Desk</p>
        <h1 className="serif">{session ? "Write and publish." : "Sign in to the desk."}</h1>
        <p>
          {session
            ? "Posts go live within seconds. Nothing is committed to GitHub, and the site does not rebuild."
            : "Only the site owner can open this desk."}
        </p>
      </header>
      {session ? (
        <OwnerDesk initialPosts={posts} linkedin={connection} loadError={loadError} notice={notice} />
      ) : (
        <div className="note">
          <a className="btn" href={`/api/linkedin/start?next=${AUTHOR_PATH}`}>
            Sign in with LinkedIn
          </a>
        </div>
      )}
    </main>
  );
}
