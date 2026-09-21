-- Una imagen eliminada/reemplazada conserva su ruta hasta completar la limpieza de Storage.
alter table public.product_options add column if not exists faq_items jsonb not null default '{}'::jsonb;
create table public.media_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);
alter table public.media_cleanup_queue enable row level security;
create policy "Admins manage media cleanup" on public.media_cleanup_queue
  for all using (public.is_admin()) with check (public.is_admin());
create function public.queue_removed_media() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'DELETE' then
    insert into public.media_cleanup_queue(storage_bucket, storage_path)
    values(old.storage_bucket, old.storage_path) on conflict do nothing;
  elsif old.storage_bucket is distinct from new.storage_bucket or old.storage_path is distinct from new.storage_path then
    insert into public.media_cleanup_queue(storage_bucket, storage_path)
    values(old.storage_bucket, old.storage_path) on conflict do nothing;
  end if;
  return null;
end;
$$;
create trigger queue_product_media after delete or update on public.product_images
  for each row execute function public.queue_removed_media();
create trigger queue_project_media after delete or update on public.project_images
  for each row execute function public.queue_removed_media();

-- Publicación heredada: un acabado solo es público si toda su jerarquía lo es.
drop policy "Published products are public" on public.products;
create policy "Published products are public" on public.products for select using (
  status = 'published' and exists(select 1 from public.categories c where c.id = category_id and c.status = 'published')
);
drop policy "Published product variants are public" on public.product_variants;
create policy "Published product variants are public" on public.product_variants for select using (
  status = 'published' and exists(select 1 from public.products p where p.id = product_id and p.status = 'published')
);
drop policy "Published product options are public" on public.product_options;
create policy "Published product options are public" on public.product_options for select using (
  status = 'published' and exists(select 1 from public.product_variants v where v.id = variant_id and v.status = 'published')
);

insert into public.site_settings(key, value, is_public)
values ('catalog_url', 'https://drive.google.com/drive/folders/12p5iAFIaNjnZSjPvLG4gPOmNUzrrt794?usp=drive_link', true)
on conflict (key) do nothing;
