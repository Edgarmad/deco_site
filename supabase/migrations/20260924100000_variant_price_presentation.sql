alter table public.product_variants
  add column if not exists price_presentation text
  check (price_presentation in ('Caja', 'Pieza'));

-- La presentación técnica ya fue importada por acabado. Solo asignar la unidad
-- comercial si las presentaciones reconocidas de la familia coinciden.
with presentations as (
  select variant_id,
    case
      when lower(trim(technical_specs->>'presentation')) ~ '^[0-9]+ piezas por caja$' then 'Caja'
      when lower(trim(technical_specs->>'presentation')) = 'pieza' then 'Pieza'
    end as unit
  from public.product_options
), consistent as (
  select variant_id, min(unit) as unit
  from presentations
  where unit is not null
  group by variant_id
  having count(distinct unit) = 1
)
update public.product_variants as variant
set price_presentation = consistent.unit
from consistent
where variant.id = consistent.variant_id
  and variant.price_presentation is null;
