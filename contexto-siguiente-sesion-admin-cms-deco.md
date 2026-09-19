# Contexto siguiente sesion: Admin CMS DECO ABC

Este archivo resume el estado real despues de contrastar `contexto-agente-supabase-cms-deco.md` y `contexto-codex-cms-deco.md` con lo ya implementado. El objetivo de la siguiente sesion es construir el panel `/admin` sobre la base Supabase ya existente.

## Estado actual confirmado

- El frontend sigue en Astro, ahora actualizado a Astro 7.
- El deploy en Vercel funciona.
- Astro esta configurado con `@astrojs/vercel` moderno.
- El proyecto esta alineado a Node `24.x` en `package.json` y `.nvmrc`.
- El problema anterior de Astro 4 + `@astrojs/vercel@7` con Node 24 ya fue corregido actualizando Astro/Vercel adapter.
- Supabase esta vinculado al proyecto remoto `nkpgaguvquzpajzwudtb`.
- La migracion SQL ya fue aplicada en Supabase remoto.
- Las tablas del CMS ya existen.
- RLS ya esta habilitado en tablas y Storage.
- El bucket publico `site-media` ya existe.
- El inventario base ya fue sembrado en Supabase.
- Las 256 imagenes del inventario ya fueron convertidas a WebP y subidas a Supabase Storage con rutas SEO-friendly.
- Productos, variantes, opciones y categorias ya fueron publicados en Supabase.
- El catalogo publico `/productos` ya consulta Supabase en runtime.
- Las fichas publicas `/productos/[slug]` ya consultan Supabase en runtime y devuelven 404 real cuando no existe o no esta publicado.
- `src/services/projectService.ts` y `src/services/locationService.ts` ya consultan Supabase con fallback local.
- No existe implementacion real de WordPress y ya no hay uso funcional de `WORDPRESS_API_URL` en servicios.
- No existe todavia ninguna ruta `/admin`.

## Archivos importantes ya creados o modificados

- `astro.config.mjs`: adapter Vercel moderno con `@astrojs/vercel`.
- `package.json`: dependencias de Supabase, Vercel adapter, Sharp, WS; scripts Supabase; `engines.node = 24.x`.
- `.nvmrc`: `24`.
- `.env.example`: variables Supabase sin secretos.
- `src/lib/supabase.ts`: cliente Supabase para runtime, con transporte `ws` heredado de la correccion anterior de WebSocket; no bloquea Node 24.
- `src/services/productService.ts`: productos desde Supabase.
- `src/services/projectService.ts`: proyectos desde Supabase.
- `src/services/locationService.ts`: ubicaciones desde Supabase.
- `src/types/products.ts`, `src/types/projects.ts`, `src/types/locations.ts`: tipos actualizados.
- `src/pages/productos.astro`, `src/pages/productos/[slug].astro`: SSR runtime.
- `src/pages/proyectos.astro`, `src/pages/proyectos/[slug].astro`: SSR runtime.
- `src/pages/ubicaciones.astro`: SSR runtime.
- `supabase/migrations/20260918120000_cms_schema.sql`: schema, RLS, Storage.
- `scripts/seed-supabase-inventory.mjs`: seed desde `inventario_final.json`.
- `scripts/upload-product-images-to-supabase.mjs`: convierte/sube imagenes WebP a Storage.
- `SUPABASE_CMS.md`: documentacion base.

## Base de datos actual

Tablas creadas:

```text
profiles
categories
products
product_variants
product_options
product_images
projects
project_images
locations
```

Conteos sembrados del inventario:

```text
categories       2
products         14
product_variants 19
product_options  112
product_images   256
```

Estado publico actual:

```text
categories       published
products         published
product_variants published
product_options  published
```

Ejemplo de slug publico correcto:

```text
/productos/panel-lambrin-wpc-lambrin-wavy-max-brasilia
```

No adaptar el codigo para aceptar slugs cortos como `/productos/lambrin-wavy-max-brasilia`; el usuario pidio no hacerlo. El slug publico debe ser el que existe en Supabase.

## Variables necesarias

En local y Vercel deben existir:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
```

Solo para scripts locales/server-side controlados:

```text
SUPABASE_SERVICE_ROLE_KEY
```

No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.

## Scripts disponibles

```bash
npm run build
npx astro check
npm run supabase:push
npm run supabase:seed:inventory
npm run supabase:upload:product-images
```

Notas:

- `npm run supabase:seed:inventory` lee `.env` local automaticamente.
- `npm run supabase:upload:product-images` tambien lee `.env` local automaticamente.
- No volver a correr seed sin entender que usa `upsert` y puede actualizar rutas/estados segun el script.

## Decision importante sobre imagenes

Las imagenes finales del CMS deben vivir en Supabase Storage, no en Vercel ni en rutas locales.

Bucket:

```text
site-media
```

Formato actual de rutas:

```text
products/{product-slug}/{variant-slug}/{option-slug}/{kind}/{nn}-{seo-name}.webp
```

Ejemplo:

```text
products/deck/general/deck-caoba/main/01-deck-caoba-main.webp
```

## Objetivo de la siguiente sesion

Construir el panel administrativo propio en `/admin` con Supabase Auth y proteccion servidor.

Prioridad recomendada:

1. Crear autenticacion admin.
2. Proteger `/admin/**` server-side.
3. Crear layout simple del admin.
4. CRUD de ubicaciones como primer modulo pequeño.
5. CRUD/listado de productos respetando la estructura `products > product_variants > product_options > product_images`.
6. CRUD de proyectos e imagenes.

## Rutas admin esperadas

Crear estas rutas de forma incremental:

```text
/admin/login
/admin
/admin/productos
/admin/productos/[id]
/admin/proyectos
/admin/proyectos/nuevo
/admin/proyectos/[id]
/admin/ubicaciones
/admin/ubicaciones/nueva
/admin/ubicaciones/[id]
```

No es obligatorio crear todas en el primer bloque. Empezar por login, dashboard y ubicaciones reduce riesgo.

## Autenticacion y proteccion recomendada

Usar Supabase Auth email/password.

Requisitos:

- Sin registro publico.
- Login en `/admin/login`.
- Logout.
- Sesion con cookies seguras para SSR.
- Middleware o helper server-side para proteger `/admin/**`.
- Verificar en servidor que el usuario tenga perfil `profiles.role = 'admin'`.
- Si no hay sesion, redirigir a `/admin/login`.
- Si hay sesion pero no es admin, mostrar 403 o cerrar sesion.

Importante: la proteccion no debe depender solo de JS del navegador.

## Primer admin

Si todavia no existe admin, crear usuario en Supabase Auth y luego insertar perfil:

```sql
insert into public.profiles (id, email, role)
values ('USER_ID_AQUI', 'admin@dominio.com', 'admin')
on conflict (id) do update set role = 'admin', email = excluded.email;
```

La tabla `profiles` ya existe y RLS ya espera `role = 'admin'` para escrituras.

## CRUD de ubicaciones recomendado primero

Motivo: es la tabla mas simple y permite validar auth, formularios, RLS, errores y redirects sin tocar la estructura compleja de productos.

Campos de `locations`:

```text
id
name
city
address
schedule
phone
whatsapp_url
maps_url
latitude
longitude
status
sort_order
seo_title
seo_description
created_at
updated_at
```

Acciones:

- Listar.
- Crear.
- Editar.
- Publicar/despublicar.
- Eliminar con confirmacion.

## Productos: consideraciones para el admin

No tratar productos como tabla plana. La ficha publica corresponde a `product_options`.

Jerarquia real:

```text
categories -> products -> product_variants -> product_options -> product_images
```

En UI administrativa, lo mas simple es:

- Listado principal de opciones/acabados publicables (`product_options`) con columnas de producto, variante, acabado, status y slug.
- Pantalla de edicion de una opcion/acabado con datos SEO, descripcion, specs e imagenes.
- Secciones auxiliares para editar familia/producto y variante.

No romper slugs existentes sin confirmacion porque ya son URLs publicas.

## Proyectos

Actualmente existe tabla y servicio, pero no hay datos reales sembrados confirmados para proyectos.

Campos principales:

```text
title
slug
summary
content
category
location
surface
materials
challenge
result
status
featured
sort_order
seo_title
seo_description
```

Imagenes en `project_images` y Storage `site-media`.

## Estado de Vercel y Node

El deploy funciona en:

```text
https://deco-site-kappa.vercel.app
```

Estado actual:

- El proyecto corre con Node 24 (`package.json` y `.nvmrc`).
- Astro fue actualizado a Astro 7 y `@astrojs/vercel` a la version moderna compatible con Node 24.
- `npm run build` ya no emite la advertencia anterior de runtime Node no soportado.
- `@supabase/supabase-js@2.116.0` sigue usando `ws` como transporte en `src/lib/supabase.ts`; esto no bloquea Node 24 y puede mantenerse salvo que se pruebe que ya no es necesario.

Nota historica: antes el proyecto estaba temporalmente forzado a Node 20 por incompatibilidad de Astro 4 + `@astrojs/vercel@7` con Node 24. Esa restriccion ya no aplica.

## Verificaciones antes de cerrar cada bloque

Ejecutar:

```bash
npx astro check
npm run build
```

Si se toca Supabase remoto, validar con consultas no destructivas usando:

```bash
supabase db query --linked "select ..."
```

## Pendientes reales

- Crear `/admin/login`.
- Implementar manejo de sesion Supabase Auth con cookies en SSR.
- Crear helper/middleware de admin.
- Crear dashboard `/admin`.
- Crear CRUD de ubicaciones.
- Crear admin de productos/opciones/imagenes.
- Crear admin de proyectos/imagenes.
- Definir UX de subida de imagenes desde el panel: validar MIME/tamano, convertir o comprimir si se hace client/server-side, subir a `site-media`, actualizar DB y limpiar archivos reemplazados.
- Mejorar SEO dinamico de fichas publicas con `seo_title`, `seo_description`, canonical y Open Graph desde Supabase.
- Crear datos reales de proyectos y ubicaciones desde el admin o seed separado.

## Instrucciones para el siguiente agente

- No rehacer la migracion base salvo que sea necesario agregar columnas o funciones.
- No volver a WordPress.
- No mover imagenes a Vercel.
- No cambiar el esquema de slugs publicos sin confirmacion.
- No usar `SUPABASE_SERVICE_ROLE_KEY` en codigo cliente.
- Mantener el sitio publico visualmente igual.
- Empezar por auth/admin y validar con una tabla simple antes de productos.
