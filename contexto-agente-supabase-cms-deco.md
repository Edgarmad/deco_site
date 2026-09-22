# Contexto para agente: CMS DECO ABC con Supabase, Astro y Vercel

Este documento actualiza el plan del CMS de DECO ABC para que otro agente pueda continuar sin asumir una integracion real de WordPress. WordPress queda descartado por completo. El proyecto debe migrar a Supabase como unica fuente de datos administrable.

## Estado real del proyecto

- El frontend esta hecho con Astro.
- El proyecto ya esta conectado a Vercel.
- La cuenta de Supabase ya existe y por ahora sera la cuenta personal del propietario; eventualmente se migrara o replicara a la cuenta del cliente.
- No existe una implementacion real de WordPress.
- Las referencias actuales a `WORDPRESS_API_URL` en `src/services/productService.ts` y `src/services/projectService.ts` son una capa previa/temporal y deben eliminarse durante la migracion.
- El contenido actual de productos y proyectos es decoy, usado solo para validar visualmente el sitio.
- Los productos actuales vienen de arreglos locales en `src/data/products.ts`.
- Los proyectos actuales vienen de arreglos locales en `src/data/projects.ts`.
- Las ubicaciones actuales estan hardcodeadas en `src/pages/ubicaciones.astro`.
- El archivo base para planear el inventario real es `inventario_final.json`.
- Los paths de imagen dentro de `inventario_final.json` son temporales. Las imagenes finales deben subirse a Supabase Storage y renombrarse con claves seguras.

## Inventario base

Usar `inventario_final.json` como referencia inicial para crear la migracion y/o seed de productos.

Resumen actual del inventario:

- Categorias: 2.
- Productos: 14.
- Variantes: 19.
- Colores/acabados: 112.
- Archivos de imagen: 256.

Jerarquia del archivo:

```text
categories > products > variants > colors > images
```

Categorias detectadas:

```text
exterior
interior
```

Productos detectados:

```text
exterior/deck
exterior/lambrin-exterior
exterior/viga-exterior
exterior/wallcladding
interior/cristal-carbono
interior/panel-lambrin-wpc
interior/panel-reforzado-400
interior/panel-techo-spc-3m-6m
interior/piedra-flexible
interior/piedra-pu
interior/pisos-spc
interior/placas-marmol-destellos
interior/placas-tipo-marmol
interior/vigas-interior
```

No asumir que este inventario ya esta completo comercialmente. Es la base tecnica para estructurar datos y migraciones.

## Decision SEO principal

Para SEO conviene que cada color/acabado publicable tenga una URL propia, no solo la familia de producto.

Estrategia recomendada:

```text
/productos/[slug]
```

Donde `[slug]` corresponde a una variante comercial final indexable, por ejemplo:

```text
/productos/deck-caoba
/productos/deck-gris-antique
/productos/lambrin-exterior-cepillado-negro
/productos/panel-lambrin-wpc-lambrin-wavy-max-roble-dorado
```

Razonamiento:

- Permite indexar busquedas especificas por producto, variante y color.
- Mejora titulos, descripciones, Open Graph y datos estructurados por acabado.
- Mantiene paginas mas relevantes para busquedas long-tail.
- Permite enlazar directamente un acabado desde catalogo, Google, WhatsApp o campanas.
- Conserva la agrupacion visual de productos relacionados mediante familia/variante.

La familia de producto tambien puede existir como entidad administrativa, pero la ficha publica principal debe resolver una variante/color publicable.

## Modelo conceptual recomendado

No meter todos los productos en una sola tabla plana. El inventario real tiene familia, variante y color/acabado; esa estructura debe conservarse.

Mapeo obligatorio desde el Excel `DECO_ABC_Plantilla_Inventario_Productos (1).xlsx`:

```text
Producto                -> products              -> Tipo de producto base
Familia(Subcategoria)   -> product_variants      -> Familia publica agrupadora
Variante / Color        -> product_options       -> Color/acabado con URL propia
```

Regla publica: las fichas y selectores de producto deben mostrar unicamente los colores/acabados (`product_options`) que pertenecen a la misma familia del Excel (`product_variants`). No se deben mezclar colores de otras familias aunque compartan el mismo `Producto` del Excel o el mismo tipo visual del catalogo. Ejemplo: `Lambrin Irregular` solo puede listar sus 6 colores; no debe incluir colores de `Lambrin Premium` ni `Lambrin Wavy Max`.

Tablas sugeridas:

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

Interpretacion:

- `categories`: interior/exterior u otras categorias publicas futuras.
- `products`: familia o linea principal, por ejemplo `Deck`, `Panel Lambrin WPC`.
- `product_variants`: subfamilia o variante tecnica, por ejemplo `Cepillado`, `Lambrin Wavy Max`, `General`.
- `product_options`: color/acabado publicable final, por ejemplo `Caoba`, `Negro`, `Roble Dorado`. Esta entidad debe tener slug propio y puede tener ficha publica.
- `product_images`: imagenes asociadas preferentemente al `product_option`, pero puede permitirse asociarlas tambien a producto o variante si se necesita material generico.
- `projects`: trabajos/proyectos administrables.
- `locations`: ubicaciones/sucursales administrables.
- `profiles`: roles administrativos vinculados a Supabase Auth.

## Campos sugeridos

### `categories`

```text
id uuid primary key
name text not null
slug text unique not null
description text
status text check in ('draft', 'published')
sort_order int default 0
seo_title text
seo_description text
created_at timestamptz
updated_at timestamptz
```

### `products`

```text
id uuid primary key
category_id uuid references categories(id)
name text not null
slug text unique not null
summary text
description text
status text check in ('draft', 'published')
featured boolean default false
sort_order int default 0
seo_title text
seo_description text
created_at timestamptz
updated_at timestamptz
```

### `product_variants`

```text
id uuid primary key
product_id uuid references products(id)
name text not null
slug text not null
summary text
description text
sort_order int default 0
status text check in ('draft', 'published')
created_at timestamptz
updated_at timestamptz
unique(product_id, slug)
```

### `product_options`

Esta es la entidad mas importante para SEO. Representa el color/acabado que tendra ficha publica.

```text
id uuid primary key
variant_id uuid references product_variants(id)
name text not null
slug text unique not null
sku text
summary text
description text
color_name text
color_slug text
color_hex text
finish text
dimensions text
thickness text
material text
usage text
technical_specs jsonb default '{}'::jsonb
installation_notes text
care_notes text
status text check in ('draft', 'published')
featured boolean default false
sort_order int default 0
seo_title text
seo_description text
canonical_path text
source_path text
created_at timestamptz
updated_at timestamptz
```

Notas:

- `source_path` puede guardar temporalmente el path local original de `inventario_final.json` para trazabilidad durante la migracion.
- No usar `source_path` como URL publica final.
- `canonical_path` puede quedar como `/productos/[slug]` o generarse en codigo.
- `technical_specs` permite avanzar sin sobredisenar tablas de especificaciones. Si mas adelante se requieren filtros tecnicos avanzados, se normaliza.

### `product_images`

```text
id uuid primary key
product_id uuid references products(id) null
variant_id uuid references product_variants(id) null
option_id uuid references product_options(id) null
storage_bucket text not null
storage_path text not null
original_source_path text
original_filename text
alt_text text
kind text check in ('main', 'secondary', 'gallery', 'extra', 'technical')
mime_type text
size_bytes bigint
width int
height int
sort_order int default 0
created_at timestamptz
```

Regla: al menos uno de `product_id`, `variant_id` u `option_id` debe existir. Para el MVP, usar principalmente `option_id` porque las imagenes actuales estan por color/acabado.

### `projects`

```text
id uuid primary key
title text not null
slug text unique not null
summary text
content text
category text
location text
year text
surface text
materials jsonb default '[]'::jsonb
challenge text
result text
status text check in ('draft', 'published')
featured boolean default false
sort_order int default 0
seo_title text
seo_description text
created_at timestamptz
updated_at timestamptz
```

### `project_images`

```text
id uuid primary key
project_id uuid references projects(id)
storage_bucket text not null
storage_path text not null
alt_text text
kind text check in ('main', 'gallery', 'before', 'after')
sort_order int default 0
created_at timestamptz
```

### `locations`

```text
id uuid primary key
name text not null
city text not null
type text
address text
schedule text
phone text
whatsapp_url text
maps_url text
latitude numeric
longitude numeric
status text check in ('draft', 'published')
sort_order int default 0
seo_title text
seo_description text
created_at timestamptz
updated_at timestamptz
```

## Supabase Storage

Las imagenes deben vivir en Supabase Storage, no en rutas locales.

Bucket recomendado inicial:

```text
site-media
```

Rutas recomendadas:

```text
products/{product-slug}/{variant-slug}/{option-slug}/main/{safe-file-name}.webp
products/{product-slug}/{variant-slug}/{option-slug}/gallery/{safe-file-name}.webp
projects/{project-slug}/main/{safe-file-name}.webp
projects/{project-slug}/gallery/{safe-file-name}.webp
locations/{location-slug}/{safe-file-name}.webp
```

Requisitos:

- No usar directamente el nombre original como clave final.
- Guardar `original_source_path` y `original_filename` solo como trazabilidad.
- Convertir o preparar nombres seguros: minusculas, sin espacios, sin acentos, sin caracteres especiales.
- Idealmente convertir a `.webp` cuando se implemente la migracion de imagenes.
- Guardar `alt_text` editable desde el panel.
- Mantener `kind` y `sort_order` para imagen principal, secundaria y galeria.

## Admin CMS

Por ahora solo habra un admin.

Usar:

- Supabase Auth con email/password.
- Tabla `profiles` con `role = 'admin'`.
- Sin registro publico.
- Proteccion real del lado servidor para `/admin`.
- RLS en todas las tablas.

Rutas administrativas sugeridas:

```text
/admin/login
/admin
/admin/productos
/admin/productos/nuevo
/admin/productos/[id]
/admin/proyectos
/admin/proyectos/nuevo
/admin/proyectos/[id]
/admin/ubicaciones
/admin/ubicaciones/nueva
/admin/ubicaciones/[id]
```

Para productos, la UI debe permitir editar:

- Datos de familia/producto.
- Variantes tecnicas.
- Colores/acabados publicables.
- Datos especificos de cada color/acabado.
- Imagen principal, secundaria y extras por color/acabado.
- SEO por color/acabado.
- Estado borrador/publicado.

## Integracion con Astro

El proyecto actualmente usa salida estatica. Para que el CMS refleje cambios sin redeploy manual por cada edicion, configurar Astro para Vercel con rutas servidor donde haga falta.

Rutas que deben consultar Supabase en runtime o tener una estrategia explicita de cache/revalidacion:

```text
/admin/**
/productos
/productos/[slug]
/proyectos
/proyectos/[slug]
/ubicaciones
```

No convertir todo el sitio a SSR sin necesidad. Mantener estatico lo que no dependa del CMS.

## Cambios esperados en codigo

- Eliminar referencias funcionales a WordPress.
- Reemplazar `src/services/productService.ts` para leer Supabase.
- Reemplazar `src/services/projectService.ts` para leer Supabase.
- Crear servicio para ubicaciones, por ejemplo `src/services/locationService.ts`.
- Mantener componentes visuales existentes mientras sea posible.
- Adaptar tipos en `src/types/products.ts` para reflejar producto, variante y opcion/color publicable.
- Conservar temporalmente datos locales como fallback solo durante la migracion, si ayuda a no romper el build.

## Politicas RLS esperadas

- Lectura anonima solo de contenido `published`.
- Escritura solo para usuario autenticado con perfil admin.
- Storage publico solo para lectura de imagenes publicadas, si se decide usar URLs publicas.
- Nadie anonimo puede subir, reemplazar ni borrar archivos.
- Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.

## Migracion desde `inventario_final.json`

Crear migracion SQL versionada y, si conviene, un script de seed separado.

Mapeo recomendado:

```text
category -> categories
product -> products
variant -> product_variants
color -> product_options
color.images.main -> product_images kind='main'
color.images.secondary -> product_images kind='secondary'
color.images.extras -> product_images kind='extra'
```

Los registros creados desde inventario pueden iniciar como `draft` hasta que se valide contenido, SEO e imagenes finales.

## Criterios MVP

- Un admin puede iniciar sesion.
- El admin puede crear/editar/publicar ubicaciones.
- El admin puede crear/editar/publicar proyectos con imagenes.
- El admin puede crear/editar productos, variantes y colores/acabados.
- Cada color/acabado publicado puede tener URL publica propia para SEO.
- El catalogo muestra solo opciones publicadas.
- Una opcion en borrador no aparece publicamente.
- Las fichas publicas generan 404 real si el slug no existe o no esta publicado.
- Las imagenes se almacenan en Supabase Storage.
- El sitio compila y despliega en Vercel.

## Pendientes que debe resolver el agente

- Definir si la primera version usara cache corta o SSR sin cache para catalogo/fichas.
- Definir si las imagenes se migran en el mismo bloque o en una fase posterior.
- Crear `.env.example` sin secretos.
- Documentar creacion del primer admin.
- Documentar flujo para replicar Supabase personal hacia la cuenta final del cliente.
