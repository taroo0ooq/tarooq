-- Visitor chatbot rate limits.
-- Stores a hashed IP and a short-lived counter. No message text.
-- Not applied by the app. Run this in the Supabase SQL editor (or the migration flow) before the chatbot can answer.
-- The table lives in the private schema. The public function is executable only by service_role.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.chat_rate_limits (
  key_hash text primary key,
  hits integer not null,
  window_start timestamptz not null,
  expires_at timestamptz not null,
  constraint chat_rate_limits_hash_check check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint chat_rate_limits_hits_check check (hits >= 0 and hits <= 1000)
);

comment on table private.chat_rate_limits is
  'Hashed visitor address and a short-lived chatbot counter. No conversation text.';

alter table private.chat_rate_limits enable row level security;

revoke all on table private.chat_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.chat_rate_limits to service_role;

create index if not exists chat_rate_limits_expires_idx on private.chat_rate_limits (expires_at);

create or replace function public.consume_chat_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns jsonb
language plpgsql
security invoker
set search_path = private, public
as $$
declare
  v_now timestamptz := now();
  v_hits integer;
  v_expires timestamptz;
  v_allowed boolean;
  v_retry integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid rate key';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'invalid rate limit';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate window';
  end if;

  delete from private.chat_rate_limits where expires_at <= v_now;

  insert into private.chat_rate_limits as row (key_hash, hits, window_start, expires_at)
  values (p_key_hash, 1, v_now, v_now + make_interval(secs => p_window_seconds))
  on conflict (key_hash) do update
    set hits = least(row.hits + 1, 1000)
  returning hits, expires_at into v_hits, v_expires;

  v_allowed := v_hits <= p_limit;
  if v_allowed then
    v_retry := 0;
  else
    v_retry := greatest(1, ceil(extract(epoch from (v_expires - v_now)))::int);
  end if;

  return jsonb_build_object('allowed', v_allowed, 'retry_after', v_retry);
end;
$$;

revoke all on function public.consume_chat_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_chat_rate_limit(text, integer, integer) to service_role;

comment on function public.consume_chat_rate_limit(text, integer, integer) is
  'Increments a short-lived chatbot counter for a hashed visitor key. Does not store messages.';
