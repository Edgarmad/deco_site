alter table public.product_options
  add column if not exists price numeric(12,2) not null default 1.00,
  add column if not exists technical_sheet_url text,
  add column if not exists installation_guide_url text,
  add column if not exists section_visibility jsonb not null default '{}'::jsonb;

insert into public.site_settings (key, value, is_public)
values
  ('product_section_technical_enabled', 'true', true),
  ('product_section_support_enabled', 'true', true),
  ('product_section_faq_enabled', 'true', true),
  ('product_section_installation_enabled', 'true', true)
on conflict (key) do nothing;
