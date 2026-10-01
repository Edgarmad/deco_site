-- Datos aislados en transacción; ejecutar después de product_gallery_roles.
begin;
select set_config('test.admin_id', gen_random_uuid()::text, true);
select set_config('test.category_id', gen_random_uuid()::text, true);
select set_config('test.product_id', gen_random_uuid()::text, true);
select set_config('test.variant_id', gen_random_uuid()::text, true);
select set_config('test.other_variant_id', gen_random_uuid()::text, true);
select set_config('test.option_id', gen_random_uuid()::text, true);
select set_config('test.file_id', gen_random_uuid()::text, true);
select set_config('test.other_file_id', gen_random_uuid()::text, true);
insert into auth.users(id) values(current_setting('test.admin_id')::uuid);
insert into public.profiles(id, role) values(current_setting('test.admin_id')::uuid, 'admin');
select set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
set local role authenticated;
insert into public.categories(id,name,slug,status) values(current_setting('test.category_id')::uuid,'Gallery test',current_setting('test.category_id'),'published');
insert into public.products(id,category_id,name,slug,status) values(current_setting('test.product_id')::uuid,current_setting('test.category_id')::uuid,'Gallery test',current_setting('test.product_id'),'published');
insert into public.product_variants(id,product_id,name,slug,status) values
  (current_setting('test.variant_id')::uuid,current_setting('test.product_id')::uuid,'Gallery test',current_setting('test.variant_id'),'published'),
  (current_setting('test.other_variant_id')::uuid,current_setting('test.product_id')::uuid,'Other family',current_setting('test.other_variant_id'),'published');
insert into public.product_options(id,variant_id,name,slug,status) values(current_setting('test.option_id')::uuid,current_setting('test.variant_id')::uuid,'Color',current_setting('test.option_id'),'published');
insert into public.product_images(option_id,storage_bucket,storage_path,kind,sort_order) values
  (current_setting('test.option_id')::uuid,'site-media','gallery-test/main.webp','main',3),
  (current_setting('test.option_id')::uuid,'site-media','gallery-test/swatch.webp','swatch',-1),
  (current_setting('test.option_id')::uuid,'site-media','gallery-test/secondary.webp','secondary',2);
insert into public.product_support_files(id,variant_id,title,storage_bucket,storage_path,original_filename,mime_type,size_bytes) values
  (current_setting('test.file_id')::uuid,current_setting('test.variant_id')::uuid,'Ficha técnica','site-media','gallery-test/technical.pdf','technical.pdf','application/pdf',10),
  (current_setting('test.other_file_id')::uuid,current_setting('test.other_variant_id')::uuid,'Otro PDF','site-media','gallery-test/other.pdf','other.pdf','application/pdf',10);
update public.product_variants set technical_support_file_id = current_setting('test.file_id')::uuid where id = current_setting('test.variant_id')::uuid;
do $$ begin
  begin
    update public.product_variants set technical_support_file_id = current_setting('test.other_file_id')::uuid where id = current_setting('test.variant_id')::uuid;
    raise exception 'Allowed PDF from another family';
  exception when foreign_key_violation then null; end;
  update public.product_images set sort_order = -10 where option_id = current_setting('test.option_id')::uuid and kind = 'main';
  if not exists(select 1 from public.product_images where option_id = current_setting('test.option_id')::uuid and kind = 'main' and sort_order = -10) then raise exception 'Image order not saved'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if not exists(select 1 from public.product_variants where id = current_setting('test.variant_id')::uuid and technical_support_file_id = current_setting('test.file_id')::uuid) then raise exception 'Selected PDF hidden'; end if;
  if not exists(select 1 from public.product_images where option_id = current_setting('test.option_id')::uuid and kind = 'swatch') then raise exception 'Published swatch hidden'; end if;
  update public.product_variants set technical_support_file_id = null where id = current_setting('test.variant_id')::uuid;
  if found then raise exception 'Anonymous PDF selection allowed'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
update public.categories set status = 'draft' where id = current_setting('test.category_id')::uuid;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if exists(select 1 from public.product_images where option_id = current_setting('test.option_id')::uuid) then raise exception 'Images leaked through draft ancestor'; end if;
  if exists(select 1 from public.product_support_files where id = current_setting('test.file_id')::uuid) then raise exception 'PDF leaked through draft ancestor'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
delete from public.product_support_files where id = current_setting('test.file_id')::uuid;
do $$ begin
  if exists(select 1 from public.product_variants where id = current_setting('test.variant_id')::uuid and technical_support_file_id is not null) then raise exception 'Deleted PDF selection not cleared'; end if;
  if not exists(select 1 from public.media_cleanup_queue where storage_path = 'gallery-test/technical.pdf') then raise exception 'Missing PDF cleanup'; end if;
end $$;
-- También comprueba la cascada familia -> archivo cuando el archivo está seleccionado.
update public.product_variants set technical_support_file_id = current_setting('test.other_file_id')::uuid where id = current_setting('test.other_variant_id')::uuid;
delete from public.product_variants where id = current_setting('test.other_variant_id')::uuid;
rollback;
select 'PASS: gallery roles, order, family ownership, RLS, deletion and cascade (rolled back)' as result;
