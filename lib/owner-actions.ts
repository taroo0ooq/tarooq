import { randomBytes } from "node:crypto";
import { openToken, personUrn } from "./linkedin";
import { isOwner } from "./owner-session";
import { isDefiniteLinkedInRejection, LinkedInPublishError, linkedInUrl, parseLinkedInUrn, publishToLinkedIn } from "./linkedin-publish";
import { imageContentType } from "./post-image";
import { assertDocumentPath, assertPdf, newDocumentPath } from "./post-document";
import { alignPostUrl, pickSlug, postUrl, PostInputError, riyadhDate, statusNote } from "./post-draft";
import type { PostDraft } from "./post-publish";
import type { LinkPlacement, PostInsert, PostRow, PostsDb } from "./post-types";
import { postCanonicalPath } from "./post-locale";
import { splitPostSlug, toOwnerPost, type OwnerPost } from "./post-view";
import { readPublicImage } from "./public-image";
import { SupabaseRequestError } from "./supabase-posts";

export type ActionContext = {
  now: Date;
  origin: string;
  supabaseUrl?: string;
  fetchImpl?: typeof fetch;
  linkedinVersion?: string;
  onChange?: (slugs: string[]) => void;
  sleep?: (ms: number) => Promise<void>;
};

export type ActionResult = {
  post: OwnerPost;
  note: string;
  warning: string;
  url: string;
};

export class LinkedInOutcomeError extends PostInputError {
  saved?: PostRow;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertSlug(slug: string) {
  if (!SLUG.test(slug) || slug.length > 80) throw new PostInputError("Post not found.", 404);
}

function touch(ctx: ActionContext, slugs: string[]) {
  ctx.onChange?.(slugs.filter(Boolean));
}

function view(row: PostRow, ctx: ActionContext): ActionResult {
  const origin = ctx.origin.replace(/\/$/, "");
  return {
    post: toOwnerPost(row, ctx.supabaseUrl || process.env.SUPABASE_URL || ""),
    note: statusNote(row.linkedin_mode === "both", row.linkedin_status),
    warning: row.linkedin_status === "failed" ? row.linkedin_error : "",
    url: `${origin}${postCanonicalPath(row.slug, row.lang)}`,
  };
}

function alignDraft(draft: PostDraft, origin: string, slug: string) {
  const placement: LinkPlacement = draft.linkPlacement === "text" ? "text" : "comment";
  const parts = splitPostSlug(slug);
  const url = parts ? postUrl(origin, parts.date, parts.short, draft.lang) : "";
  let linkedinText = draft.linkedinText;
  if (placement === "text" && parts && (draft.linkedin || linkedinText.trim())) {
    linkedinText = alignPostUrl(linkedinText, origin, parts.date, parts.short, draft.lang);
  }
  let firstComment = (draft.firstComment ?? "").trim();
  if (placement === "comment" && !firstComment && url) firstComment = url;
  return { ...draft, linkPlacement: placement, linkedinText, firstComment };
}

function contentPatch(draft: PostDraft): Partial<PostInsert> {
  return {
    title: draft.title,
    description: draft.description,
    body: draft.body,
    lang: draft.lang,
    seo_title: draft.seoTitle,
    seo_description: draft.seoDescription,
    linkedin_text: draft.linkedinText,
    linkedin_mode: draft.linkedin ? "both" : "site",
    link_placement: draft.linkPlacement === "text" ? "text" : "comment",
    first_comment: draft.firstComment ?? "",
  };
}

function statusPatch(draft: PostDraft, now: Date, existing: PostRow | null): Partial<PostInsert> {
  if (draft.intent === "draft" || draft.intent === "unpublish") {
    return { status: "draft", scheduled_for: null };
  }
  if (draft.intent === "schedule") {
    if (!draft.scheduledFor) throw new PostInputError("Choose a time to schedule the post.");
    if (new Date(draft.scheduledFor).getTime() <= now.getTime() + 30_000) {
      throw new PostInputError("Schedule the post at least a minute ahead, in Riyadh time.");
    }
    return { status: "scheduled", scheduled_for: draft.scheduledFor };
  }
  return {
    status: "published",
    scheduled_for: null,
    published_at: existing?.published_at ?? now.toISOString(),
  };
}

async function storeCover(db: PostsDb, slug: string, image: NonNullable<PostDraft["image"]>) {
  const objectPath = `covers/${slug}-${randomBytes(4).toString("hex")}.${image.ext}`;
  await db.uploadImage(objectPath, image.bytes, imageContentType(image.ext));
  return objectPath;
}

async function storeDocument(db: PostsDb, bytes: Buffer) {
  assertPdf(bytes);
  const objectPath = newDocumentPath();
  await db.uploadDocument(objectPath, bytes);
  return objectPath;
}

function assertExclusiveMedia(draft: PostDraft) {
  if (draft.image && (draft.document || draft.documentPath)) {
    throw new PostInputError("Choose an image or a PDF, not both.");
  }
  if (draft.siteCover && draft.image) throw new PostInputError("Send one image.");
}

async function resolveDocument(db: PostsDb, draft: PostDraft, existing: PostRow | null) {
  assertExclusiveMedia(draft);
  if (draft.document) {
    if (!draft.documentTitle.trim()) throw new PostInputError("Document title is required.");
    return { path: await storeDocument(db, draft.document.bytes), title: draft.documentTitle.trim(), previous: existing?.doc_path ?? "" };
  }
  if (draft.documentPath) {
    if (!draft.documentTitle.trim()) throw new PostInputError("Document title is required.");
    assertDocumentPath(draft.documentPath);
    const stored = await db.readDocument(draft.documentPath);
    if (!stored) throw new PostInputError("The uploaded PDF could not be read.");
    assertPdf(stored.bytes);
    const previous = existing?.doc_path && existing.doc_path !== draft.documentPath ? existing.doc_path : "";
    return { path: draft.documentPath, title: draft.documentTitle.trim(), previous };
  }
  if (draft.removeDocument) return { path: "", title: "", previous: existing?.doc_path ?? "" };
  if (existing?.doc_path) {
    const title = (draft.documentTitle || existing.doc_title).trim();
    if (!title) throw new PostInputError("Document title is required.");
    return { path: existing.doc_path, title, previous: "" };
  }
  return { path: "", title: "", previous: "" };
}

async function coverForLinkedIn(db: PostsDb, row: PostRow) {
  if (!row.cover_path) return null;
  if (row.cover_path.startsWith("/")) {
    const file = readPublicImage(row.cover_path);
    return { bytes: file.bytes, contentType: file.contentType, alt: row.cover_alt };
  }
  if (/^https?:\/\//i.test(row.cover_path)) {
    throw new PostInputError("Remote cover images cannot be posted to LinkedIn from the desk.");
  }
  const stored = await db.readImage(row.cover_path);
  if (!stored) throw new PostInputError("The cover image could not be read.");
  return { bytes: stored.bytes, contentType: stored.contentType, alt: row.cover_alt };
}

async function documentForLinkedIn(db: PostsDb, row: PostRow) {
  if (!row.doc_path) return null;
  assertDocumentPath(row.doc_path);
  const stored = await db.readDocument(row.doc_path);
  if (!stored) throw new PostInputError("The PDF could not be read.");
  assertPdf(stored.bytes);
  if (!row.doc_title.trim()) throw new PostInputError("Document title is required.");
  return { bytes: stored.bytes, title: row.doc_title.trim() };
}

async function loadConnection(db: PostsDb, now: Date) {
  const row = await db.getConnection();
  if (!row) throw new PostInputError("Connect LinkedIn before posting there.", 409);
  const token = openToken(row.access_token);
  if (!token) throw new PostInputError("The saved LinkedIn token could not be read. Connect LinkedIn again.", 409);
  if (new Date(row.expires_at).getTime() <= now.getTime()) {
    throw new PostInputError("The LinkedIn token has expired. Connect LinkedIn again.", 409);
  }
  if (!isOwner(row.person_id)) throw new PostInputError("The saved LinkedIn account is not the site owner.", 403);
  return { token, authorUrn: row.person_urn || personUrn(row.person_id) };
}

export async function publishLinkedInForRow(db: PostsDb, row: PostRow, ctx: ActionContext) {
  if (row.linkedin_urn || row.linkedin_status === "posted") return row;
  let connection: { token: string; authorUrn: string };
  try {
    connection = await loadConnection(db, ctx.now);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect LinkedIn before posting there.";
    const failed = (await db.update(row.slug, { linkedin_status: "failed", linkedin_error: message.slice(0, 500) })) ?? row;
    const outcome = new LinkedInOutcomeError(message, error instanceof PostInputError ? error.status : 409);
    outcome.saved = failed;
    throw outcome;
  }
  const source = `${ctx.origin.replace(/\/$/, "")}${postCanonicalPath(row.slug, row.lang)}`;
  const document = await documentForLinkedIn(db, row);
  const image = document ? null : await coverForLinkedIn(db, row);
  const claim = await db.claimLinkedIn(row.id);
  if (!claim.claimed) {
    if (claim.state === "posted" && claim.urn.startsWith("urn:")) {
      await db.finishLinkedIn(row.id, claim.urn, claim.url || linkedInUrl(claim.urn));
      return (await db.getBySlug(row.slug)) ?? row;
    }
    const message = "LinkedIn publishing already started for this post, so it was not sent again.";
    await db.failLinkedIn(row.id, message, false);
    const outcome = new LinkedInOutcomeError(message, 409);
    outcome.saved = (await db.getBySlug(row.slug)) ?? row;
    throw outcome;
  }
  try {
    const urn = await publishToLinkedIn({
      accessToken: connection.token,
      version: ctx.linkedinVersion || process.env.LINKEDIN_VERSION || "202609",
      authorUrn: connection.authorUrn,
      commentary: row.linkedin_text,
      title: row.seo_title || row.title,
      description: row.seo_description || row.description,
      source,
      image,
      document,
      linkPlacement: row.link_placement === "text" ? "text" : "comment",
      sleep: ctx.sleep,
      fetchImpl: ctx.fetchImpl,
    });
    await db.finishLinkedIn(row.id, urn, linkedInUrl(urn));
    return (await db.getBySlug(row.slug)) ?? row;
  } catch (error) {
    const status = error instanceof LinkedInPublishError ? error.status : error instanceof PostInputError ? error.status : 0;
    const definite = error instanceof LinkedInPublishError ? isDefiniteLinkedInRejection(status) : error instanceof PostInputError;
    const message = (error instanceof Error ? error.message : "LinkedIn publishing failed.").slice(0, 500);
    await db.failLinkedIn(row.id, message, definite);
    const saved = (await db.getBySlug(row.slug)) ?? row;
    const outcome = new LinkedInOutcomeError(message, status || 502);
    outcome.saved = saved;
    throw outcome;
  }
}

async function maybeLinkedIn(db: PostsDb, row: PostRow, draft: PostDraft, ctx: ActionContext) {
  if (draft.intent !== "publish" || row.linkedin_mode !== "both") {
    if (row.linkedin_mode !== "both" && row.linkedin_status !== "posted" && row.linkedin_status !== "hold") {
      return (await db.update(row.slug, { linkedin_status: "hold", linkedin_error: "" })) ?? row;
    }
    return row;
  }
  try {
    return await publishLinkedInForRow(db, row, ctx);
  } catch (error) {
    if (error instanceof LinkedInOutcomeError) throw error;
    const outcome = new LinkedInOutcomeError(error instanceof Error ? error.message : "LinkedIn publishing failed.", 502);
    outcome.saved = row;
    throw outcome;
  }
}

function resultFrom(row: PostRow, ctx: ActionContext, warning = "") {
  const value = view(row, ctx);
  if (warning) value.warning = warning;
  return value;
}

async function finishSave(db: PostsDb, row: PostRow, draft: PostDraft, ctx: ActionContext) {
  try {
    const saved = await maybeLinkedIn(db, row, draft, ctx);
    touch(ctx, [saved.slug]);
    return resultFrom(saved, ctx);
  } catch (error) {
    if (error instanceof LinkedInOutcomeError && error.saved) {
      touch(ctx, [error.saved.slug]);
      return resultFrom(error.saved, ctx, error.message);
    }
    throw error;
  }
}

function assertAlt(draft: PostDraft, existing: PostRow | null) {
  const hasImage = Boolean(draft.image || draft.siteCover) || (!draft.removeCover && Boolean(existing?.cover_path));
  if (hasImage && !draft.imageAlt) throw new PostInputError("Add alt text for the image.");
}

function coverFile(draft: PostDraft) {
  return draft.siteCover ?? draft.image;
}

export async function createOwnerPost(db: PostsDb, draft: PostDraft, ctx: ActionContext) {
  assertAlt(draft, null);
  const date = riyadhDate(ctx.now);
  const document = await resolveDocument(db, draft, null);
  let saved: PostRow | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const existing = await db.list();
    const short = pickSlug(draft.title, date, existing.map((row) => `${row.slug}.mdx`), []);
    const slug = `${date}-${short}`;
    const aligned = alignDraft(draft, ctx.origin, slug);
    const insert: PostInsert = {
      slug,
      title: aligned.title,
      description: aligned.description,
      body: aligned.body,
      lang: aligned.lang,
      status: "draft",
      published_on: date,
      published_at: null,
      scheduled_for: null,
      cover_path: "",
      cover_alt: aligned.imageAlt,
      seo_title: aligned.seoTitle,
      seo_description: aligned.seoDescription,
      linkedin_text: aligned.linkedinText,
      linkedin_mode: aligned.linkedin ? "both" : "site",
      linkedin_status: "hold",
      linkedin_urn: "",
      linkedin_url: "",
      linkedin_error: "",
      link_placement: aligned.linkPlacement,
      first_comment: aligned.firstComment,
      doc_path: document.path,
      doc_title: document.title,
      ...statusPatch(aligned, ctx.now, null),
    };
    const cover = coverFile(aligned);
    if (cover) insert.cover_path = await storeCover(db, slug, cover);
    try {
      saved = await db.insert(insert);
      draft = aligned;
      break;
    } catch (error) {
      const status = error instanceof SupabaseRequestError ? error.status : (error as { status?: number }).status;
      if (status === 409 && attempt === 0) continue;
      throw error;
    }
  }
  if (!saved) throw new PostInputError("Could not save the post.", 500);
  return finishSave(db, saved, draft, ctx);
}

export async function updateOwnerPost(db: PostsDb, slug: string, draft: PostDraft, ctx: ActionContext) {
  assertSlug(slug);
  const existing = await db.getBySlug(slug);
  if (!existing) throw new PostInputError("Post not found.", 404);
  assertAlt(draft, existing);
  const aligned = alignDraft(draft, ctx.origin, existing.slug);
  const document = await resolveDocument(db, aligned, existing);
  const patch: Partial<PostInsert> = {
    ...contentPatch(aligned),
    ...statusPatch(aligned, ctx.now, existing),
    doc_path: document.path,
    doc_title: document.title,
  };
  let previousCover = "";
  const cover = coverFile(aligned);
  if (cover) {
    patch.cover_path = await storeCover(db, existing.slug, cover);
    patch.cover_alt = aligned.imageAlt;
    previousCover = existing.cover_path;
  } else if (aligned.removeCover) {
    patch.cover_path = "";
    patch.cover_alt = "";
    previousCover = existing.cover_path;
  } else if (existing.cover_path) {
    patch.cover_alt = aligned.imageAlt;
  }
  const saved = await db.update(existing.slug, patch);
  if (!saved) throw new PostInputError("Post not found.", 404);
  if (previousCover && previousCover !== saved.cover_path && !previousCover.startsWith("/") && !/^https?:\/\//i.test(previousCover)) {
    await db.deleteImage(previousCover).catch(() => undefined);
  }
  if (document.previous && document.previous !== saved.doc_path) {
    await db.deleteDocument(document.previous).catch(() => undefined);
  }
  return finishSave(db, saved, aligned, ctx);
}

export async function deleteOwnerPost(db: PostsDb, slug: string, ctx: ActionContext) {
  assertSlug(slug);
  const existing = await db.getBySlug(slug);
  if (!existing) throw new PostInputError("Post not found.", 404);
  if (existing.cover_path && !existing.cover_path.startsWith("/") && !/^https?:\/\//i.test(existing.cover_path)) {
    await db.deleteImage(existing.cover_path).catch(() => undefined);
  }
  if (existing.doc_path) await db.deleteDocument(existing.doc_path).catch(() => undefined);
  await db.remove(existing.slug);
  touch(ctx, [existing.slug]);
  return { ok: true as const, slug: existing.slug };
}

export async function retryLinkedIn(db: PostsDb, slug: string, ctx: ActionContext) {
  assertSlug(slug);
  const existing = await db.getBySlug(slug);
  if (!existing) throw new PostInputError("Post not found.", 404);
  if (existing.status !== "published") throw new PostInputError("Publish the post on the site before sending it to LinkedIn.");
  if (existing.linkedin_mode !== "both") throw new PostInputError("Choose Site + LinkedIn before retrying.");
  try {
    const saved = await publishLinkedInForRow(db, existing, ctx);
    touch(ctx, [saved.slug]);
    return resultFrom(saved, ctx);
  } catch (error) {
    if (error instanceof LinkedInOutcomeError && error.saved) {
      touch(ctx, [error.saved.slug]);
      return resultFrom(error.saved, ctx, error.message);
    }
    throw error;
  }
}

export async function clearLinkedInClaim(db: PostsDb, slug: string, ctx: ActionContext) {
  assertSlug(slug);
  const existing = await db.getBySlug(slug);
  if (!existing) throw new PostInputError("Post not found.", 404);
  if (existing.linkedin_status === "posted" || existing.linkedin_urn) {
    throw new PostInputError("This post is already on LinkedIn.");
  }
  await db.releaseLinkedIn(existing.id);
  const saved = (await db.update(existing.slug, { linkedin_status: "hold", linkedin_error: "" })) ?? existing;
  touch(ctx, [saved.slug]);
  return resultFrom(saved, ctx);
}

export async function recordLinkedIn(db: PostsDb, slug: string, value: string, ctx: ActionContext) {
  assertSlug(slug);
  const existing = await db.getBySlug(slug);
  if (!existing) throw new PostInputError("Post not found.", 404);
  const urn = parseLinkedInUrn(value);
  const url = linkedInUrl(urn);
  await db.finishLinkedIn(existing.id, urn, url);
  const saved = (await db.getBySlug(existing.slug)) ?? existing;
  touch(ctx, [saved.slug]);
  return resultFrom(saved, ctx);
}

export async function promoteDuePosts(db: PostsDb, ctx: ActionContext) {
  const due = (await db.list()).filter((row) => row.status === "scheduled" && row.scheduled_for && new Date(row.scheduled_for).getTime() <= ctx.now.getTime());
  const slugs: string[] = [];
  for (const row of due) {
    const published = await db.update(row.slug, {
      status: "published",
      published_at: row.published_at ?? ctx.now.toISOString(),
      scheduled_for: null,
    });
    if (!published) continue;
    slugs.push(published.slug);
    if (published.linkedin_mode === "both" && published.linkedin_status !== "posted" && !published.linkedin_urn) {
      try {
        await publishLinkedInForRow(db, published, ctx);
      } catch {
        // The failure is stored on the row. The site copy is already public.
      }
    }
  }
  if (slugs.length > 0) touch(ctx, slugs);
  return slugs;
}
