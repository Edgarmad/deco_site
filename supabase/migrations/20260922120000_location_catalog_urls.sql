alter table public.locations add column if not exists catalog_url text;

update public.locations
set catalog_url = (
  select value from public.site_settings where key = 'catalog_url'
)
where catalog_url is null
  and exists (select 1 from public.site_settings where key = 'catalog_url');

delete from public.site_settings where key = 'catalog_url';
