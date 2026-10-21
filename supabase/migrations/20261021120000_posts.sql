-- Posts, the private LinkedIn token, and the cover-image bucket.
-- Idempotent. The server uses SUPABASE_SECRET_KEY (service role, bypasses RLS).
-- anon and authenticated can only read posts that are public. They cannot write.

create extension if not exists pgcrypto;

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to service_role;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text not null default '',
  body text not null default '',
  lang text not null default 'en',
  status text not null default 'draft',
  published_on date not null,
  published_at timestamptz,
  scheduled_for timestamptz,
  cover_path text not null default '',
  cover_alt text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  linkedin_text text not null default '',
  linkedin_mode text not null default 'site',
  linkedin_status text not null default 'hold',
  linkedin_urn text not null default '',
  linkedin_url text not null default '',
  linkedin_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists description text not null default '';
alter table public.posts add column if not exists body text not null default '';
alter table public.posts add column if not exists lang text not null default 'en';
alter table public.posts add column if not exists status text not null default 'draft';
alter table public.posts add column if not exists published_on date;
alter table public.posts add column if not exists published_at timestamptz;
alter table public.posts add column if not exists scheduled_for timestamptz;
alter table public.posts add column if not exists cover_path text not null default '';
alter table public.posts add column if not exists cover_alt text not null default '';
alter table public.posts add column if not exists seo_title text not null default '';
alter table public.posts add column if not exists seo_description text not null default '';
alter table public.posts add column if not exists linkedin_text text not null default '';
alter table public.posts add column if not exists linkedin_mode text not null default 'site';
alter table public.posts add column if not exists linkedin_status text not null default 'hold';
alter table public.posts add column if not exists linkedin_urn text not null default '';
alter table public.posts add column if not exists linkedin_url text not null default '';
alter table public.posts add column if not exists linkedin_error text not null default '';
alter table public.posts add column if not exists created_at timestamptz not null default now();
alter table public.posts add column if not exists updated_at timestamptz not null default now();

do $$ begin
  alter table public.posts add constraint posts_slug_key unique (slug);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_lang_check check (lang in ('en', 'ar'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_status_check check (status in ('draft', 'scheduled', 'published'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_linkedin_mode_check check (linkedin_mode in ('site', 'both'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_linkedin_status_check check (linkedin_status in ('hold', 'posted', 'failed'));
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_schedule_check check (status <> 'scheduled' or scheduled_for is not null);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_title_len check (char_length(title) between 1 and 140);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_description_len check (char_length(description) <= 400);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_body_len check (char_length(body) <= 20000);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_linkedin_len check (char_length(linkedin_text) <= 3000);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_alt_len check (char_length(cover_alt) <= 1000);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_seo_title_len check (char_length(seo_title) <= 70);
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_seo_description_len check (char_length(seo_description) <= 160);
exception when duplicate_object then null;
end $$;

create index if not exists posts_published_on_idx on public.posts (published_on desc, slug desc);
create index if not exists posts_scheduled_idx on public.posts (scheduled_for) where status = 'scheduled';

create or replace function public.posts_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.posts_set_updated_at();

alter table public.posts enable row level security;

drop policy if exists posts_public_read on public.posts;
create policy posts_public_read
on public.posts
for select
to anon, authenticated
using (
  status = 'published'
  or (status = 'scheduled' and scheduled_for is not null and scheduled_for <= now())
);

revoke all on table public.posts from anon, authenticated;
grant select on table public.posts to anon, authenticated;
grant select, insert, update, delete on table public.posts to service_role;

create table if not exists private.linkedin_connection (
  id integer primary key default 1,
  access_token text not null,
  expires_at timestamptz not null,
  person_id text not null default '',
  person_urn text not null default '',
  name text not null default '',
  email text not null default '',
  updated_at timestamptz not null default now(),
  constraint linkedin_connection_singleton check (id = 1)
);

create table if not exists private.linkedin_claims (
  post_id uuid primary key references public.posts (id) on delete cascade,
  state text not null default 'posting',
  urn text not null default '',
  url text not null default '',
  error text not null default '',
  claimed_at timestamptz not null default now(),
  constraint linkedin_claims_state_check check (state in ('posting', 'posted'))
);

alter table private.linkedin_connection enable row level security;
alter table private.linkedin_claims enable row level security;

revoke all on table private.linkedin_connection from public, anon, authenticated;
revoke all on table private.linkedin_claims from public, anon, authenticated;
grant select, insert, update, delete on table private.linkedin_connection to service_role;
grant select, insert, update, delete on table private.linkedin_claims to service_role;

create or replace function public.claim_linkedin_publish(p_post_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = private, public
as $$
declare
  inserted_count integer;
  existing private.linkedin_claims%rowtype;
begin
  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception 'Post not found';
  end if;

  insert into private.linkedin_claims (post_id, state)
  values (p_post_id, 'posting')
  on conflict (post_id) do nothing;

  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then
    return jsonb_build_object('claimed', true, 'state', 'posting', 'urn', '', 'url', '');
  end if;

  select * into existing from private.linkedin_claims where post_id = p_post_id;
  return jsonb_build_object(
    'claimed', false,
    'state', coalesce(existing.state, ''),
    'urn', coalesce(existing.urn, ''),
    'url', coalesce(existing.url, '')
  );
end;
$$;

create or replace function public.finish_linkedin_publish(p_post_id uuid, p_urn text, p_url text)
returns void
language plpgsql
security invoker
set search_path = private, public
as $$
declare
  current_urn text;
begin
  if p_urn is null or p_urn !~ '^urn:li:' then
    raise exception 'LinkedIn URN is invalid';
  end if;
  if p_url is null or p_url !~ '^https://www\.linkedin\.com/' then
    raise exception 'LinkedIn URL is invalid';
  end if;

  insert into private.linkedin_claims (post_id, state, urn, url)
  values (p_post_id, 'posted', p_urn, p_url)
  on conflict (post_id) do update
    set state = 'posted',
        urn = excluded.urn,
        url = excluded.url,
        error = ''
    where private.linkedin_claims.state <> 'posted'
       or private.linkedin_claims.urn = excluded.urn;

  select urn into current_urn from private.linkedin_claims where post_id = p_post_id;
  if current_urn is distinct from p_urn then
    raise exception 'LinkedIn id is already recorded';
  end if;

  update public.posts
  set linkedin_status = 'posted',
      linkedin_urn = p_urn,
      linkedin_url = p_url,
      linkedin_error = ''
  where id = p_post_id;
end;
$$;

create or replace function public.fail_linkedin_publish(p_post_id uuid, p_error text, p_release boolean)
returns void
language plpgsql
security invoker
set search_path = private, public
as $$
begin
  update public.posts
  set linkedin_status = 'failed',
      linkedin_error = left(coalesce(p_error, ''), 500)
  where id = p_post_id;

  if coalesce(p_release, false) then
    delete from private.linkedin_claims
    where post_id = p_post_id and state <> 'posted';
  else
    update private.linkedin_claims
    set error = left(coalesce(p_error, ''), 500)
    where post_id = p_post_id and state <> 'posted';
  end if;
end;
$$;

create or replace function public.release_linkedin_claim(p_post_id uuid)
returns void
language plpgsql
security invoker
set search_path = private, public
as $$
begin
  delete from private.linkedin_claims
  where post_id = p_post_id and state <> 'posted';
end;
$$;

create or replace function public.save_linkedin_connection(
  p_access_token text,
  p_expires_at timestamptz,
  p_person_id text,
  p_person_urn text,
  p_name text,
  p_email text
)
returns void
language plpgsql
security invoker
set search_path = private, public
as $$
begin
  if coalesce(p_access_token, '') = '' then
    raise exception 'LinkedIn token is empty';
  end if;

  insert into private.linkedin_connection (
    id, access_token, expires_at, person_id, person_urn, name, email, updated_at
  )
  values (
    1,
    p_access_token,
    p_expires_at,
    coalesce(p_person_id, ''),
    coalesce(p_person_urn, ''),
    coalesce(p_name, ''),
    coalesce(p_email, ''),
    now()
  )
  on conflict (id) do update
  set access_token = excluded.access_token,
      expires_at = excluded.expires_at,
      person_id = excluded.person_id,
      person_urn = excluded.person_urn,
      name = excluded.name,
      email = excluded.email,
      updated_at = now();
end;
$$;

create or replace function public.linkedin_connection()
returns table (
  access_token text,
  expires_at timestamptz,
  person_id text,
  person_urn text,
  name text,
  email text,
  updated_at timestamptz
)
language sql
security invoker
stable
set search_path = private, public
as $$
  select access_token, expires_at, person_id, person_urn, name, email, updated_at
  from private.linkedin_connection
  where id = 1;
$$;

revoke all on function public.posts_set_updated_at() from public, anon, authenticated;
grant execute on function public.posts_set_updated_at() to service_role;

revoke all on function public.claim_linkedin_publish(uuid) from public, anon, authenticated;
grant execute on function public.claim_linkedin_publish(uuid) to service_role;

revoke all on function public.finish_linkedin_publish(uuid, text, text) from public, anon, authenticated;
grant execute on function public.finish_linkedin_publish(uuid, text, text) to service_role;

revoke all on function public.fail_linkedin_publish(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.fail_linkedin_publish(uuid, text, boolean) to service_role;

revoke all on function public.release_linkedin_claim(uuid) from public, anon, authenticated;
grant execute on function public.release_linkedin_claim(uuid) to service_role;

revoke all on function public.save_linkedin_connection(text, timestamptz, text, text, text, text) from public, anon, authenticated;
grant execute on function public.save_linkedin_connection(text, timestamptz, text, text, text, text) to service_role;

revoke all on function public.linkedin_connection() from public, anon, authenticated;
grant execute on function public.linkedin_connection() to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  4194304,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists post_images_public_read on storage.objects;
create policy post_images_public_read
on storage.objects
for select
to public
using (bucket_id = 'post-images');
