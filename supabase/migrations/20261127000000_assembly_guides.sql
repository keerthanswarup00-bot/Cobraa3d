begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guides', 'guides', true, 26214400, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  file_path text unique not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.guides enable row level security;
revoke all on public.guides from public, anon, authenticated;
grant select on public.guides to anon, authenticated;
grant select, insert, update, delete on public.guides to service_role;

drop policy if exists "guides are readable by everyone" on public.guides;
create policy "guides are readable by everyone"
  on public.guides for select to anon, authenticated using (true);

commit;
