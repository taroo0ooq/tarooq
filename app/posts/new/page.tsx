import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Readex_Pro } from "next/font/google";
import { AUTHOR_PATH } from "@/lib/linkedin";
import { OWNER_COOKIE, openOwnerSession } from "@/lib/owner-session";
import { siteUrl } from "@/lib/site";
import { riyadhDate } from "@/lib/post-draft";
import { PostComposer } from "@/components/PostComposer";

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
  title: "New post",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const jar = await cookies();
  const session = openOwnerSession(jar.get(OWNER_COOKIE)?.value ?? "");
  const date = riyadhDate();

  return (
    <main className={`page ${arabic.variable}`}>
      <header className="page-head">
        <p className="eyebrow">Owner</p>
        <h1 className="serif">{session ? "Write a post." : "Sign in to write."}</h1>
        <p>
          {session
            ? "This commits the post to the repository. The site updates after the deploy. LinkedIn runs from the workflow only when you choose it."
            : "This page is only for the site owner."}
        </p>
      </header>
      {session ? (
        <PostComposer date={date} origin={siteUrl} />
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
