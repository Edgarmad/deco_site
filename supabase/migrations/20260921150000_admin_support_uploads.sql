-- Los PDF viajan directamente a Storage para admitir 15 MB sin el límite de body de Vercel.
alter table public.product_support_files
  add column upload_state text not null default 'ready' check (upload_state in ('pending', 'ready'));
drop policy "Support files for published product variants are public" on public.product_support_files;
create policy "Support files for published product variants are public"
  on public.product_support_files for select using (
    upload_state = 'ready' and variant_id in (select id from public.product_variants where status = 'published')
  );
create trigger queue_support_media after delete or update on public.product_support_files
  for each row execute function public.queue_removed_media();
