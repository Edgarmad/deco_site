create table if not exists public.location_agents (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  phone text not null,
  photo_bucket text,
  photo_path text,
  status text not null default 'published' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(photo_bucket, photo_path)
);

drop trigger if exists set_location_agents_updated_at on public.location_agents;
create trigger set_location_agents_updated_at before update on public.location_agents
  for each row execute function public.set_updated_at();

alter table public.location_agents enable row level security;

create policy "Published location agents are public" on public.location_agents for select using (
  status = 'published'
  and exists(select 1 from public.locations l where l.id = location_id and l.status = 'published')
);

create policy "Admins manage location agents" on public.location_agents
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.queue_removed_location_agent_photo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' and old.photo_bucket is not null and old.photo_path is not null then
    insert into public.media_cleanup_queue(storage_bucket, storage_path)
    values(old.photo_bucket, old.photo_path) on conflict do nothing;
  elsif old.photo_bucket is distinct from new.photo_bucket or old.photo_path is distinct from new.photo_path then
    if old.photo_bucket is not null and old.photo_path is not null then
      insert into public.media_cleanup_queue(storage_bucket, storage_path)
      values(old.photo_bucket, old.photo_path) on conflict do nothing;
    end if;
  end if;
  return null;
end;
$$;

create trigger queue_location_agent_media after delete or update on public.location_agents
  for each row execute function public.queue_removed_location_agent_photo();
