create table if not exists public.product_support_files (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  title text not null,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

alter table public.product_support_files enable row level security;

create policy "Support files for published product variants are public"
  on public.product_support_files for select using (
    variant_id in (select id from public.product_variants where status = 'published')
  );

create policy "Admins manage product support files"
  on public.product_support_files for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read support media"
  on storage.objects for select using (bucket_id = 'site-media');

create policy "Admins manage support media"
  on storage.objects for all using (bucket_id = 'site-media' and public.is_admin()) with check (bucket_id = 'site-media' and public.is_admin());
