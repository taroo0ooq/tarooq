"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { formatDraftDate, LINKEDIN_LIMIT, riyadhDate } from "@/lib/post-draft";
import { postCanonicalPath } from "@/lib/post-locale";
import type { ConnectionView, OwnerPost } from "@/lib/post-view";

type DeskProps = {
  initialPosts: OwnerPost[];
  linkedin: ConnectionView;
  loadError: string;
  notice: string;
};

type Result = {
  post?: OwnerPost;
  note?: string;
  warning?: string;
  url?: string;
  error?: string;
  slug?: string;
};

function blank() {
  return {
    title: "",
    description: "",
    lang: "en" as "en" | "ar",
    body: "",
    linkedinText: "",
    imageAlt: "",
    publish: "site" as "site" | "both",
    seoTitle: "",
    seoDescription: "",
    scheduledFor: "",
  };
}

function riyadhInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date(iso));
}

function prefill(body: string) {
  const text = body.trim();
  return text.length > LINKEDIN_LIMIT ? text.slice(0, LINKEDIN_LIMIT) : text;
}

export function OwnerDesk({ initialPosts, linkedin, loadError, notice }: DeskProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [fields, setFields] = useState(blank);
  const [linkedinDirty, setLinkedinDirty] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeCover, setRemoveCover] = useState(false);
  const [pending, setPending] = useState("");
  const [error, setError] = useState(loadError);
  const [note, setNote] = useState(notice);
  const [warning, setWarning] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recordUrn, setRecordUrn] = useState("");

  const selected = selectedSlug ? posts.find((post) => post.slug === selectedSlug) ?? null : null;
  const arabic = fields.lang === "ar";
  const html = useMemo(() => (fields.body.trim() ? renderMarkdown(fields.body, fields.lang) : ""), [fields.body, fields.lang]);
  const over = fields.linkedinText.length > LINKEDIN_LIMIT;
  const today = riyadhDate();

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (linkedinDirty || selected) return;
    setFields((current) => ({ ...current, linkedinText: prefill(current.body) }));
  }, [fields.body, linkedinDirty, selected]);

  function patch(partial: Partial<typeof fields>) {
    setFields((current) => ({ ...current, ...partial }));
  }

  function select(post: OwnerPost | null) {
    setSelectedSlug(post?.slug ?? null);
    setFields(post ? {
      title: post.title,
      description: post.description,
      lang: post.lang,
      body: post.body,
      linkedinText: post.linkedinText,
      imageAlt: post.coverAlt,
      publish: post.linkedinMode,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      scheduledFor: riyadhInput(post.scheduledFor),
    } : blank());
    setLinkedinDirty(Boolean(post));
    setFile(null);
    setRemoveCover(false);
    setError("");
    setNote("");
    setWarning("");
    setConfirmDelete(false);
    setRecordUrn("");
  }

  function merge(post: OwnerPost) {
    setPosts((current) => {
      const rest = current.filter((item) => item.slug !== post.slug && item.id !== post.id);
      return [post, ...rest];
    });
    setSelectedSlug(post.slug);
    setFields((current) => ({
      ...current,
      title: post.title,
      description: post.description,
      lang: post.lang,
      body: post.body,
      linkedinText: post.linkedinText,
      imageAlt: post.coverAlt,
      publish: post.linkedinMode,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      scheduledFor: riyadhInput(post.scheduledFor),
    }));
    setLinkedinDirty(true);
    setRemoveCover(false);
  }

  async function readResult(response: Response) {
    const payload = (await response.json().catch(() => null)) as Result | null;
    if (!response.ok || !payload || payload.error) {
      setError(payload?.error || "Could not save the post.");
      setNote("");
      return null;
    }
    return payload;
  }

  async function send(intent: string, event?: FormEvent) {
    event?.preventDefault();
    setPending(intent);
    setError("");
    setWarning("");
    try {
      const form = new FormData();
      form.set("intent", intent);
      form.set("title", fields.title);
      form.set("description", fields.description);
      form.set("lang", fields.lang);
      form.set("body", fields.body);
      form.set("linkedinText", fields.linkedinText);
      form.set("publish", fields.publish);
      form.set("imageAlt", fields.imageAlt);
      form.set("seoTitle", fields.seoTitle);
      form.set("seoDescription", fields.seoDescription);
      form.set("scheduledFor", fields.scheduledFor);
      if (file) form.set("image", file);
      if (removeCover) form.set("removeCover", "1");
      const response = await fetch(selected ? `/api/owner/posts/${selected.slug}` : "/api/owner/posts", {
        method: selected ? "PATCH" : "POST",
        body: form,
      });
      const payload = await readResult(response);
      if (!payload?.post) return;
      merge(payload.post);
      setFile(null);
      setNote(payload.note || "Saved.");
      setWarning(payload.warning || "");
    } catch {
      setError("Could not save the post.");
    } finally {
      setPending("");
    }
  }

  async function special(intent: "retry-linkedin" | "clear-linkedin" | "record-linkedin") {
    if (!selected) return;
    setPending(intent);
    setError("");
    try {
      const response = await fetch(`/api/owner/posts/${selected.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intent, linkedinUrn: recordUrn }),
      });
      const payload = await readResult(response);
      if (!payload?.post) return;
      merge(payload.post);
      setNote(payload.note || "Updated.");
      setWarning(payload.warning || "");
      setRecordUrn("");
    } catch {
      setError("Could not update LinkedIn.");
    } finally {
      setPending("");
    }
  }

  async function remove() {
    if (!selected) return;
    setPending("delete");
    setError("");
    try {
      const response = await fetch(`/api/owner/posts/${selected.slug}`, { method: "DELETE" });
      const payload = await readResult(response);
      if (!payload) return;
      setPosts((current) => current.filter((post) => post.slug !== selected.slug));
      select(null);
      setNote("Deleted. The public page updates within seconds.");
    } catch {
      setError("Could not delete the post.");
    } finally {
      setPending("");
    }
  }

  async function signOut() {
    await fetch("/api/owner/sign-out", { method: "POST" });
    window.location.href = "/posts/new";
  }

  const cover = removeCover ? "" : previewUrl || selected?.coverUrl || "";
  const busy = pending !== "";

  return (
    <div className="desk-wrap">
      <section className="desk-connect" aria-label="LinkedIn connection">
        <div>
          <p className="eyebrow">LinkedIn</p>
          {linkedin.connected ? (
            <p>
              Connected{linkedin.name ? ` as ${linkedin.name}` : ""}.
              {linkedin.expiresAt ? ` Expires ${formatWhen(linkedin.expiresAt)} (Riyadh).` : ""}
            </p>
          ) : linkedin.expired ? (
            <p>The LinkedIn token expired{linkedin.expiresAt ? ` on ${formatWhen(linkedin.expiresAt)}` : ""}. Connect again before posting.</p>
          ) : linkedin.unreadable ? (
            <p>A token is stored, but it cannot be read. Connect LinkedIn again.</p>
          ) : (
            <p>Connect LinkedIn to publish from this site. The token stays in a private table.</p>
          )}
        </div>
        <div className="desk-connect-actions">
          <a className="btn btn-purple" href="/api/linkedin/start?next=/posts/new">
            {linkedin.connected ? "Reconnect" : "Connect LinkedIn"}
          </a>
          <button className="sign-out" type="button" onClick={signOut}>Sign out</button>
        </div>
      </section>

      <div className="desk">
        <aside className="desk-rail" aria-label="Posts">
          <button className="btn desk-new" type="button" onClick={() => select(null)}>New post</button>
          {posts.length === 0 ? <p className="desk-empty">No posts in Supabase yet.</p> : null}
          <ul>
            {posts.map((post) => (
              <li key={post.id}>
                <button
                  className={post.slug === selectedSlug ? "desk-item selected" : "desk-item"}
                  type="button"
                  onClick={() => select(post)}
                >
                  <span className={`pill pill-${post.status}`}>{post.status}</span>
                  <span className="pill pill-lang">{post.lang === "ar" ? "AR" : "EN"}</span>
                  <strong>{post.title}</strong>
                  <small>{formatDraftDate(post.publishedOn)}</small>
                  <small className={post.linkedinStatus === "failed" ? "desk-warn" : ""}>
                    {post.linkedinStatus === "posted" ? "LinkedIn posted" : post.linkedinStatus === "failed" ? "LinkedIn failed" : post.linkedinMode === "both" ? "Site + LinkedIn" : "Site only"}
                  </small>
                </button>
                {post.linkedinUrl ? <a href={post.linkedinUrl}>Open on LinkedIn</a> : null}
              </li>
            ))}
          </ul>
        </aside>

        <div className="desk-main">
          <form onSubmit={(event) => send("draft", event)}>
            <div className="composer-tools">
              <p className="eyebrow">{selected ? selected.slug : "New"}</p>
              {selected?.status === "published" ? <a href={postCanonicalPath(selected.slug, selected.lang)}>View on the site</a> : null}
            </div>
            <div className={arabic ? "desk-copy article-ar" : "desk-copy"} dir={arabic ? "rtl" : "ltr"} lang={fields.lang}>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" value={fields.title} maxLength={140} required onChange={(event) => patch({ title: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <input id="description" value={fields.description} maxLength={400} onChange={(event) => patch({ description: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor="body">Body</label>
                <textarea id="body" value={fields.body} rows={12} onChange={(event) => patch({ body: event.target.value })} />
              </div>
            </div>
            <fieldset className="segmented">
              <legend>Language</legend>
              <button type="button" aria-pressed={fields.lang === "en"} onClick={() => patch({ lang: "en" })}>English</button>
              <button type="button" aria-pressed={fields.lang === "ar"} onClick={() => patch({ lang: "ar" })}>العربية</button>
            </fieldset>
            <div className="field">
              <label htmlFor="image">Cover image</label>
              <input id="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setRemoveCover(false); }} />
            </div>
            <div className="field">
              <label htmlFor="imageAlt">Cover alt text</label>
              <input id="imageAlt" value={fields.imageAlt} maxLength={1000} onChange={(event) => patch({ imageAlt: event.target.value })} />
            </div>
            {selected?.coverPath && !file ? (
              <label className="desk-check">
                <input type="checkbox" checked={removeCover} onChange={(event) => setRemoveCover(event.target.checked)} />
                Remove the current cover
              </label>
            ) : null}
            <details className="desk-seo">
              <summary>SEO</summary>
              <div className="field">
                <label htmlFor="seoTitle">SEO title</label>
                <input id="seoTitle" value={fields.seoTitle} maxLength={70} onChange={(event) => patch({ seoTitle: event.target.value })} />
                <p className="counter">{fields.seoTitle.length} / 70. Leave blank to use the title.</p>
              </div>
              <div className="field">
                <label htmlFor="seoDescription">SEO description</label>
                <input id="seoDescription" value={fields.seoDescription} maxLength={160} onChange={(event) => patch({ seoDescription: event.target.value })} />
                <p className="counter">{fields.seoDescription.length} / 160. Leave blank to use the description.</p>
              </div>
            </details>
            <div className="field">
              <label htmlFor="linkedinText">LinkedIn text</label>
              <textarea
                id="linkedinText"
                value={fields.linkedinText}
                rows={7}
                maxLength={LINKEDIN_LIMIT}
                aria-invalid={over}
                dir={arabic ? "rtl" : "ltr"}
                onChange={(event) => {
                  setLinkedinDirty(true);
                  patch({ linkedinText: event.target.value });
                }}
              />
              <p className={over ? "counter over" : "counter"}>{fields.linkedinText.length} / {LINKEDIN_LIMIT}</p>
            </div>
            <fieldset className="choice">
              <legend>Where it publishes</legend>
              <label>
                <input type="radio" name="publish" value="site" checked={fields.publish === "site"} onChange={() => patch({ publish: "site" })} />
                Site only
              </label>
              <label>
                <input type="radio" name="publish" value="both" checked={fields.publish === "both"} onChange={() => patch({ publish: "both" })} />
                Site + LinkedIn
              </label>
            </fieldset>
            <div className="field">
              <label htmlFor="scheduledFor">Schedule, Riyadh time</label>
              <input id="scheduledFor" type="datetime-local" value={fields.scheduledFor} onChange={(event) => patch({ scheduledFor: event.target.value })} />
            </div>
            {selected ? (
              <p className="desk-meta">
                <span className={`pill pill-${selected.status}`}>{selected.status}</span>
                {selected.publishedAt ? <span>Published {formatWhen(selected.publishedAt)}</span> : <span>Dated {formatDraftDate(selected.publishedOn || today)}</span>}
                {selected.linkedinUrl ? <a href={selected.linkedinUrl}>LinkedIn post</a> : <span>{selected.linkedinStatus === "posted" ? "Posted to LinkedIn" : "Not on LinkedIn yet"}</span>}
              </p>
            ) : null}
            {error ? <p className="error" role="alert">{error}</p> : null}
            {warning ? <p className="error" role="status">{warning}</p> : null}
            {note ? <p className="desk-note" role="status">{note}</p> : null}
            <div className="desk-actions">
              <button className="btn" type="submit" disabled={busy || over}>{pending === "draft" ? "Saving…" : "Save draft"}</button>
              <button className="btn btn-purple" type="button" disabled={busy || over} onClick={() => send("publish")}>{pending === "publish" ? "Publishing…" : "Publish"}</button>
              <button className="btn btn-ghost" type="button" disabled={busy || over || !fields.scheduledFor} onClick={() => send("schedule")}>{pending === "schedule" ? "Scheduling…" : "Schedule"}</button>
              {selected && selected.status !== "draft" ? (
                <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => send("unpublish")}>{pending === "unpublish" ? "Updating…" : "Unpublish"}</button>
              ) : null}
            </div>
            {selected && fields.publish === "both" && selected.linkedinStatus !== "posted" ? (
              <div className="desk-linkedin-tools">
                <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => special("retry-linkedin")}>
                  {pending === "retry-linkedin" ? "Sending…" : "Retry LinkedIn"}
                </button>
                <button className="btn btn-ghost" type="button" disabled={busy} onClick={() => special("clear-linkedin")}>
                  Clear stuck claim
                </button>
                <p className="counter">Clear the claim only if LinkedIn never showed the post. Otherwise it could be sent twice.</p>
                <div className="field">
                  <label htmlFor="recordUrn">Already on LinkedIn</label>
                  <input id="recordUrn" value={recordUrn} placeholder="urn:li:share:… or the post URL" onChange={(event) => setRecordUrn(event.target.value)} />
                </div>
                <button className="btn btn-ghost" type="button" disabled={busy || !recordUrn.trim()} onClick={() => special("record-linkedin")}>
                  Record the existing post
                </button>
              </div>
            ) : null}
            {selected ? (
              <div className="desk-danger">
                {confirmDelete ? (
                  <>
                    <p>Delete this post from the site? This does not delete it from LinkedIn.</p>
                    <button className="btn" type="button" disabled={busy} onClick={remove}>{pending === "delete" ? "Deleting…" : "Delete post"}</button>
                    <button className="btn btn-ghost" type="button" onClick={() => setConfirmDelete(false)}>Keep it</button>
                  </>
                ) : (
                  <button className="sign-out" type="button" onClick={() => setConfirmDelete(true)}>Delete post</button>
                )}
              </div>
            ) : null}
          </form>
          <aside className={arabic ? "preview-card article-ar" : "preview-card"} lang={fields.lang} dir={arabic ? "rtl" : "ltr"}>
            <p className="eyebrow">Preview</p>
            <p className="meta">{formatDraftDate(selected?.publishedOn || today)}</p>
            <h2>{fields.title || "Untitled"}</h2>
            {fields.description ? <p>{fields.description}</p> : null}
            {cover ? <img src={cover} alt={fields.imageAlt || ""} /> : null}
            {html ? <div className="prose" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="note">The preview appears as you write.</p>}
          </aside>
        </div>
      </div>
    </div>
  );
}
