-- Configuración opcional: no reemplaza portadas ni avisos ya capturados.
insert into public.site_settings (key, value, is_public)
values ('home_product_covers', '{}', true), ('privacy_notice', '', true)
on conflict (key) do nothing;

-- Puesto proporcionado y alternativa de presentación aceptada en el chat del 24/09.
update public.location_agents
set name = 'Gerente: Emilio Góngora'
where name = 'Emilio Góngora' and phone = '9991915728';
