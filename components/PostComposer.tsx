"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { renderMarkdown } from "@/lib/markdown";
import { formatDraftDate, LINKEDIN_LIMIT, postUrl, slugifyTitle } from "@/lib/post-draft";

type Result = {
  slug: string;
  url: string;
  commitUrl: string;
  queued?: boolean;
  linkedinStatus: "ready" | "hold";
  note: string;
};

function prefill(body: string, url: string) {
  const text = body.trim();
  const next = text ? `${text}\n\n${url}` : url;
  if (next.length <= LINKEDIN_LIMIT) return next;
  const room = LINKEDIN_LIMIT - url.length - 2;
  if (room <= 0) return url.slice(0, LINKEDIN_LIMIT);
  return `${text.slice(0, room).trim()}\n\n${url}`;
}

export function PostComposer({ date, origin }: { date: string; origin: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [body, setBody] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [linkedinDirty, setLinkedinDirty] = useState(false);
  const [imageAlt, setImageAlt] = useState("");
  const [publish, setPublish] = useState<"site" | "both">("site");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const slug = slugifyTitle(title) || (title.trim() ? "post" : "");
  const url = slug ? postUrl(origin, date, slug) : "";

  useEffect(() => {
    if (linkedinDirty || !url) return;
    setLinkedinText(prefill(body, url));
  }, [body, url, linkedinDirty]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const html = useMemo(() => (body.trim() ? renderMarkdown(body, lang) : ""), [body, lang]);
  const arabic = lang === "ar";
  const over = linkedinText.length > LINKEDIN_LIMIT;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/owner/posts", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as (Result & { error?: string }) | null;
      if (!response.ok || !payload || payload.error) {
        setError(payload?.error || "Could not commit the post.");
        return;
      }
      setResult(payload);
    } catch {
      setError("Could not commit the post.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    await fetch("/api/owner/sign-out", { method: "POST" });
    window.location.reload();
  }

  if (result) {
    const queued = result.queued === true;
    return (
      <div className="result-card">
        <p className="eyebrow">{queued ? "Queued" : "Committed"}</p>
        <h2 className="serif">{queued ? "The workflow is committing it." : "The post is on main."}</h2>
        <p>
          <a href={result.commitUrl}>{queued ? "Watch the workflow" : "View the commit"}</a>
        </p>
        <p>{result.note}</p>
        <p className="note">
          <a href={result.url}>{result.url}</a>
        </p>
      </div>
    );
  }

  return (
    <div className="composer">
      <form onSubmit={onSubmit}>
        <div className="composer-tools">
          <p className="eyebrow">Draft</p>
          <button className="sign-out" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" value={title} maxLength={140} required onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <input id="description" name="description" value={description} maxLength={400} required onChange={(event) => setDescription(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lang">Language</label>
          <select id="lang" name="lang" value={lang} onChange={(event) => setLang(event.target.value === "ar" ? "ar" : "en")}>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="body">Body</label>
          <textarea id="body" name="body" value={body} required rows={10} onChange={(event) => setBody(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="linkedinText">LinkedIn text</label>
          <textarea
            id="linkedinText"
            name="linkedinText"
            value={linkedinText}
            rows={8}
            maxLength={LINKEDIN_LIMIT}
            aria-invalid={over}
            onChange={(event) => {
              setLinkedinDirty(true);
              setLinkedinText(event.target.value);
            }}
          />
          <p className={over ? "counter over" : "counter"}>
            {linkedinText.length} / {LINKEDIN_LIMIT}
          </p>
        </div>
        <div className="field">
          <label htmlFor="image">Image</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </div>
        <div className="field">
          <label htmlFor="imageAlt">Image alt text</label>
          <input id="imageAlt" name="imageAlt" value={imageAlt} maxLength={1000} onChange={(event) => setImageAlt(event.target.value)} />
        </div>
        <fieldset className="choice">
          <legend>Publish</legend>
          <label>
            <input type="radio" name="publish" value="site" checked={publish === "site"} onChange={() => setPublish("site")} />
            Publish to the site only
          </label>
          <label>
            <input type="radio" name="publish" value="both" checked={publish === "both"} onChange={() => setPublish("both")} />
            Site and LinkedIn
          </label>
        </fieldset>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={pending || over}>
          {pending ? "Committing…" : "Commit post"}
        </button>
      </form>
      <aside className={arabic ? "preview-card article-ar" : "preview-card"} lang={arabic ? "ar" : "en"} dir={arabic ? "rtl" : "ltr"}>
        <p className="eyebrow">Preview</p>
        <p className="meta">{formatDraftDate(date)}</p>
        <h2>{title || "Untitled"}</h2>
        {description ? <p>{description}</p> : null}
        {previewUrl ? <img src={previewUrl} alt={imageAlt || ""} /> : null}
        {html ? <div className="prose" dangerouslySetInnerHTML={{ __html: html }} /> : <p className="note">The preview appears as you write.</p>}
      </aside>
    </div>
  );
}
