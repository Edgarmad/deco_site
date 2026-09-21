-- Prueba transaccional: todos los datos de prueba, incluido el usuario, se revierten.
begin;
select set_config('test.admin_id', gen_random_uuid()::text, true);
select set_config('test.category_id', gen_random_uuid()::text, true);
select set_config('test.product_id', gen_random_uuid()::text, true);
select set_config('test.variant_id', gen_random_uuid()::text, true);
select set_config('test.option_id', gen_random_uuid()::text, true);
select set_config('test.project_id', gen_random_uuid()::text, true);
select set_config('test.location_id', gen_random_uuid()::text, true);
insert into auth.users(id) values(current_setting('test.admin_id')::uuid);
insert into public.profiles(id, role) values(current_setting('test.admin_id')::uuid, 'admin');
select set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
set local role authenticated;
insert into public.categories(id, name, slug, status) values(current_setting('test.category_id')::uuid, 'CMS test', current_setting('test.category_id'), 'published');
insert into public.products(id, category_id, name, slug, status) values(current_setting('test.product_id')::uuid, current_setting('test.category_id')::uuid, 'CMS test', current_setting('test.product_id'), 'published');
insert into public.product_variants(id, product_id, name, slug, status) values(current_setting('test.variant_id')::uuid, current_setting('test.product_id')::uuid, 'CMS test', current_setting('test.variant_id'), 'published');
insert into public.product_options(id, variant_id, name, slug, status) values(current_setting('test.option_id')::uuid, current_setting('test.variant_id')::uuid, 'CMS test', current_setting('test.option_id'), 'published');
insert into public.projects(id, title, slug, status) values(current_setting('test.project_id')::uuid, 'CMS test', current_setting('test.project_id'), 'published');
insert into public.locations(id, name, city, status) values(current_setting('test.location_id')::uuid, 'CMS test', 'Test', 'published');
insert into public.project_images(project_id, storage_bucket, storage_path, kind) values(current_setting('test.project_id')::uuid, 'site-media', 'test/' || current_setting('test.project_id') || '.webp', 'main');
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if not exists(select 1 from public.product_options where id = current_setting('test.option_id')::uuid) then raise exception 'Published option hidden'; end if;
  if not exists(select 1 from public.projects where id = current_setting('test.project_id')::uuid) then raise exception 'Published project hidden'; end if;
  if not exists(select 1 from public.locations where id = current_setting('test.location_id')::uuid) then raise exception 'Published location hidden'; end if;
  update public.locations set name = 'UNAUTHORIZED' where id = current_setting('test.location_id')::uuid;
  if found then raise exception 'Anonymous update allowed'; end if;
  begin
    insert into public.locations(name, city) values('UNAUTHORIZED', 'Test');
    raise exception 'Anonymous insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
update public.categories set status = 'draft' where id = current_setting('test.category_id')::uuid;
update public.projects set status = 'draft' where id = current_setting('test.project_id')::uuid;
update public.locations set status = 'draft' where id = current_setting('test.location_id')::uuid;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
do $$ begin
  if exists(select 1 from public.product_options where id = current_setting('test.option_id')::uuid) then raise exception 'Option leaked through draft ancestor'; end if;
  if exists(select 1 from public.projects where id = current_setting('test.project_id')::uuid) then raise exception 'Draft project leaked'; end if;
  if exists(select 1 from public.project_images where project_id = current_setting('test.project_id')::uuid) then raise exception 'Draft project metadata leaked'; end if;
  if exists(select 1 from public.locations where id = current_setting('test.location_id')::uuid) then raise exception 'Draft location leaked'; end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('test.admin_id'), true);
delete from public.projects where id = current_setting('test.project_id')::uuid;
do $$ begin
  if not exists(select 1 from public.media_cleanup_queue where storage_path = 'test/' || current_setting('test.project_id') || '.webp') then raise exception 'Missing media cleanup after cascade'; end if;
end $$;
rollback;
select 'PASS: admin CRUD, anonymous access, draft hierarchy and media cleanup (rolled back)' as result;
