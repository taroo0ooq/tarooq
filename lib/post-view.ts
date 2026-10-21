import { renderMarkdown } from "./markdown";
import type { PostMeta } from "./posts";
import type { LinkedInConnectionRow, PostRow } from "./post-types";

export type OwnerPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  lang: "en" | "ar";
  status: "draft" | "scheduled" | "published";
  publishedOn: string;
  publishedAt: string | null;
  scheduledFor: string | null;
  coverPath: string;
  coverUrl: string;
  coverAlt: string;
  seoTitle: string;
  seoDescription: string;
  linkedinText: string;
  linkedinMode: "site" | "both";
  linkedinStatus: "hold" | "posted" | "failed";
  linkedinUrn: string;
  linkedinUrl: string;
  linkedinError: string;
  updatedAt: string;
};

export type ConnectionView = {
  connected: boolean;
  expired: boolean;
  unreadable: boolean;
  expiresAt: string | null;
  name: string;
};

export function coverPublicUrl(coverPath: string, supabaseUrl: string) {
  if (!coverPath) return "";
  if (coverPath.startsWith("/") || /^https?:\/\//i.test(coverPath)) return coverPath;
  const base = supabaseUrl.replace(/\/$/, "");
  const encoded = coverPath.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${base}/storage/v1/object/public/post-images/${encoded}`;
}

export function isPublicPost(row: PostRow, now: Date) {
  if (row.status === "published") return true;
  if (row.status === "scheduled" && row.scheduled_for) {
    return new Date(row.scheduled_for).getTime() <= now.getTime();
  }
  return false;
}

export function rowToMeta(row: PostRow, supabaseUrl: string): PostMeta {
  return {
    slug: row.slug,
    title: row.title,
    date: row.published_on,
    description: row.description,
    lang: row.lang === "ar" ? "ar" : "",
    image: coverPublicUrl(row.cover_path, supabaseUrl),
    imageAlt: row.cover_alt,
    linkedinText: row.linkedin_text,
    linkedinStatus: row.linkedin_status,
    linkedinUrn: row.linkedin_urn,
    linkedinUrl: row.linkedin_url,
    html: renderMarkdown(row.body, row.lang),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

export function toOwnerPost(row: PostRow, supabaseUrl: string): OwnerPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    body: row.body,
    lang: row.lang,
    status: row.status,
    publishedOn: row.published_on,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    coverPath: row.cover_path,
    coverUrl: coverPublicUrl(row.cover_path, supabaseUrl),
    coverAlt: row.cover_alt,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    linkedinText: row.linkedin_text,
    linkedinMode: row.linkedin_mode,
    linkedinStatus: row.linkedin_status,
    linkedinUrn: row.linkedin_urn,
    linkedinUrl: row.linkedin_url,
    linkedinError: row.linkedin_error,
    updatedAt: row.updated_at,
  };
}

export function connectionView(row: LinkedInConnectionRow | null, readable: boolean, now: Date): ConnectionView {
  if (!row || !readable) {
    return { connected: false, expired: false, unreadable: Boolean(row) && !readable, expiresAt: row?.expires_at ?? null, name: row?.name ?? "" };
  }
  const expired = new Date(row.expires_at).getTime() <= now.getTime();
  return {
    connected: !expired,
    expired,
    unreadable: false,
    expiresAt: row.expires_at,
    name: row.name,
  };
}

export function splitPostSlug(slug: string) {
  const match = /^(\d{4}-\d{2}-\d{2})-(.+)$/.exec(slug);
  if (!match) return null;
  return { date: match[1], short: match[2] };
}

export function comparePosts(a: { date: string; slug: string }, b: { date: string; slug: string }) {
  return b.date.localeCompare(a.date) || b.slug.localeCompare(a.slug);
}
