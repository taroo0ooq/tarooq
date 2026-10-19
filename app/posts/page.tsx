import type { Metadata } from "next";
import Link from "next/link";
import { formatPostDate, getPosts } from "@/lib/posts";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Posts",
  description: "Articles by Tareq Al-Ghazzi, with the LinkedIn post embedded once it is published.",
};

export default function PostsPage() {
  const posts = getPosts();
  return (
    <main className="page">
      <header className="page-head">
        <p className="eyebrow">Posts</p>
        <h1 className="serif">Notes from the work.</h1>
        <p>Articles published here. The LinkedIn post appears on the article once it is live.</p>
      </header>
      {posts.length === 0 ? (
        <p className="note">No posts yet.</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <Link className="post-card" href={`/posts/${post.slug}`} key={post.slug}>
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <h2 className="serif">{post.title}</h2>
              <p>{post.description}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
