create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

create policy "Public can read public site settings" on public.site_settings
for select using (is_public = true);

create policy "Admins can manage site settings" on public.site_settings
for all using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value, is_public)
values ('whatsapp_number', '9931595909', true)
on conflict (key) do nothing;
