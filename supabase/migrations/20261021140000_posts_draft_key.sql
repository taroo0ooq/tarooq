-- One automatic draft per Riyadh day.
-- Null means a person created the row in the desk. The daily job inserts
-- daily-YYYY-MM-DD and, on a later run that day, leaves that row unchanged.
-- Multiple nulls are allowed, so desk posts and the seed are unaffected.

alter table public.posts add column if not exists draft_key text;

do $$ begin
  alter table public.posts add constraint posts_draft_key_format
    check (draft_key is null or draft_key ~ '^daily-[0-9]{4}-[0-9]{2}-[0-9]{2}$');
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.posts add constraint posts_draft_key_key unique (draft_key);
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
