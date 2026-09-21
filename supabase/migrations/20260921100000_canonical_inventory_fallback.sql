alter table public.product_options
  add column if not exists fallback_image_path text;
