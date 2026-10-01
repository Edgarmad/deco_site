-- Muestra de color independiente y selección explícita del PDF compartido.
alter table public.product_images drop constraint product_images_kind_check;
alter table public.product_images add constraint product_images_kind_check
  check (kind in ('main', 'swatch', 'secondary', 'gallery', 'extra', 'technical'));

alter table public.product_support_files add constraint product_support_files_id_variant_unique unique (id, variant_id);
alter table public.product_variants add column technical_support_file_id uuid;
alter table public.product_variants add constraint product_variants_technical_support_file_fkey
  foreign key (technical_support_file_id, id) references public.product_support_files (id, variant_id)
  on delete set null (technical_support_file_id);

-- Conserva las fichas identificadas inequívocamente; no convierte cualquier PDF en ficha.
update public.product_variants v set technical_support_file_id = (
  select f.id from public.product_support_files f
  where f.variant_id = v.id and f.upload_state = 'ready'
    and f.title ~* 'ficha[[:space:]]+t[eé]cnica'
  order by f.sort_order, f.id limit 1
);
