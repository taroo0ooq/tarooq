-- LinkedIn document posts, and where the article URL goes.
-- Idempotent. Apply this before merging the app that writes these columns.
-- PDFs live in a private bucket. The desk uploads with a signed URL so the
-- file never passes through the app server. The service role reads the bytes
-- when publishing. anon and authenticated have no policy on this bucket.

alter table public.posts add column if not exists link_placement text not null default 'comment';
alter table public.posts add column if not exists first_comment text not null default '';
alter table public.posts add column if not exists doc_path text not null default '';
alter table public.posts add column if not exists doc_title text not null default '';

do $$ begin
  alter table public.posts add constraint posts_link_placement_check check (link_placement in ('text', 'comment'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_first_comment_len check (char_length(first_comment) <= 3000);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_doc_path_format
    check (doc_path = '' or doc_path ~ '^documents/[a-f0-9]{32}\.pdf$');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_doc_title_len check (char_length(doc_title) <= 140);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_doc_title_present
    check (doc_path = '' or char_length(btrim(doc_title)) > 0);
exception when duplicate_object then null;
end $$;

-- Rows already on LinkedIn keep today's behaviour: the URL stays in the post text.
update public.posts
set link_placement = 'text'
where linkedin_status = 'posted'
   or linkedin_urn <> '';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-documents',
  'post-documents',
  false,
  104857600,
  array['application/pdf']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

notify pgrst, 'reload schema';
