update public.product_options
set
  name = initcap(lower(regexp_replace(btrim(color_name), '^A[0-9]+-', '', 'i'))),
  color_name = initcap(lower(regexp_replace(btrim(color_name), '^A[0-9]+-', '', 'i')))
where color_name is not null
  and btrim(color_name) <> ''
  and (
    name <> initcap(lower(regexp_replace(btrim(color_name), '^A[0-9]+-', '', 'i')))
    or color_name <> initcap(lower(regexp_replace(btrim(color_name), '^A[0-9]+-', '', 'i')))
  );
