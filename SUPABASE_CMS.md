# Supabase CMS Deco ABC

> Estado actualizado del panel: [docs/admin-cms.md](docs/admin-cms.md). El admin ya está implementado; los documentos `contexto-*-cms-deco.md` describen etapas previas.

## Variables

Crear `.env` local y variables en Vercel usando `.env.example` como referencia:

```text
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` solo se usa para scripts locales/server-side. No debe exponerse al cliente.

## Setup rapido

**Referencia histórica:** el setup/seed siguiente carga `inventario_final.json`. El catálogo vigente proviene del Excel canónico con 160 combinaciones únicas; no usar ese seed para restaurar ni actualizar el catálogo actual. Consultar `docs/canonical-inventory-migration-report.md` y `docs/product-admin.md`.

Con la CLI de Supabase ya autenticada y el proyecto vinculado:

```bash
npm run supabase:setup
```

Ese comando ejecuta, en orden:

- migraciones (`supabase db push`)
- seed del inventario (`inventario_final.json`)
- conversion/subida de imagenes a Storage

Si los archivos locales del catalogo no estan disponibles, ejecutar solo schema + seed:

```bash
npm run supabase:setup:no-images
```

## Migracion manual

Para correr solo las migraciones:

```bash
npm run supabase:push
```

La migracion crea:

- `profiles`
- `categories`
- `products`
- `product_variants`
- `product_options`
- `product_images`
- `projects`
- `project_images`
- `locations`
- bucket publico `site-media`
- politicas RLS para lectura publica de contenido `published` y escritura admin

## Seed de inventario

El seed lee `inventario_final.json` y crea categorias, productos, variantes y opciones publicadas, ademas de imagenes con rutas planificadas en Storage.

```bash
npm run supabase:seed:inventory
```

Las imagenes no se suben ni convierten en este paso. `storage_path` queda preparado con nombres SEO para la fase de migracion de assets a WebP.

## Subida de imagenes a Storage

Para convertir las imagenes locales del inventario a WebP, renombrarlas con claves SEO y subirlas a Supabase Storage:

```bash
npm run supabase:upload:product-images
```

El script:

- Lee `product_images.original_source_path`.
- Convierte cada archivo a `.webp`.
- Genera rutas SEO en `site-media`.
- Sube con `upsert`.
- Actualiza `storage_path`, `mime_type`, `size_bytes`, `width` y `height`.

Formato de nombre:

```text
products/{product-slug}/{variant-slug}/{option-slug}/{kind}/{nn}-{product-slug}-{variant-slug?}-{color-slug}-{kind}.webp
```

## Primer admin

1. Crear el usuario en Supabase Auth con email/password desde el dashboard o CLI.
2. Copiar el `id` del usuario creado.
3. Insertar su perfil como admin en SQL Editor:

```sql
insert into public.profiles (id, email, role)
values ('USER_ID_AQUI', 'admin@dominio.com', 'admin')
on conflict (id) do update set role = 'admin', email = excluded.email;
```

No habilitar registro publico en el sitio.

## Replicar hacia la cuenta final del cliente

1. Crear un proyecto Supabase nuevo en la cuenta del cliente.
2. Vincular temporalmente la CLI al proyecto destino con `supabase link --project-ref PROJECT_REF`.
3. Ejecutar `npm run supabase:push` en el proyecto destino.
4. Exportar/importar datos validados o volver a ejecutar `npm run supabase:seed:inventory` si solo se necesita la base tecnica.
5. Migrar Storage copiando `site-media` con las rutas finales ya convertidas.
6. Cambiar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en Vercel al proyecto del cliente.

## Estrategia runtime

Las rutas `/`, `/productos`, `/productos/[slug]`, `/proyectos`, `/proyectos/[slug]`, `/ubicaciones`, `/busqueda` y `/contacto` usan SSR con `Cache-Control: no-store`. Las fichas no publicadas o inexistentes devuelven 404 real. Productos y proyectos no activan datos de ejemplo al quedar vacíos; ubicaciones conserva el respaldo local agregado el 21 de septiembre.

La migración `20260920150000_admin_completion.sql` agrega FAQ de acabados, limpieza reintentable de Storage y publicación dependiente de categoría/familia/variante. Ya fue aplicada al proyecto vinculado durante el cierre del CMS.

`20260921150000_admin_support_uploads.sql` agrega estados de validación de PDF y limpieza de archivos de apoyo. Los PDF se suben directamente con URL firmada para admitir hasta 15 MB en Vercel. Aplicada durante la adaptación del admin al inventario canónico y al catálogo agrupado por familia.
