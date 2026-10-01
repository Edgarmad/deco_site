# AGENTS.md — Guía de trabajo para Codex en DECO ABC

> Alcance: todo este repositorio. Contexto contrastado con el código el **30 de septiembre de 2026**.
> El nombre intencional es `AGENTS.md`, con esta capitalización, para que Codex lo descubra automáticamente también en sistemas sensibles a mayúsculas.

## 1. Objetivo del proyecto y reglas de entrada

DECO ABC es un sitio comercial en español para presentar materiales decorativos de interior y exterior, explorar familias y acabados, consultar información técnica, estimar cantidades, conocer proyectos y sucursales, y solicitar información/cotizaciones. Incluye un CMS propio en `/admin` para editar contenido. El flujo comercial actual es catálogo/contacto/WhatsApp; no existe un checkout de comercio electrónico.

Antes de cambiar código:

1. Leer esta guía y revisar `git status --short` y el diff existente. Conservar cambios del usuario.
2. Identificar la ruta, el componente, el servicio y, cuando corresponda, el modelo de formulario y la migración afectados.
3. Usar el código y las migraciones como fuente del comportamiento implementado. Los documentos narrativos pueden describir etapas anteriores.
4. Hacer cambios acotados y coherentes con los patrones existentes; actualizar esta guía si cambian contratos, arquitectura o comandos.
5. Verificar lo que corresponda al cambio y explicar en español qué se modificó, qué se comprobó y qué quedó pendiente.

### Arquitectura vigente, no histórica

- **Astro 7 + TypeScript estricto**, con páginas renderizadas en servidor (SSR).
- **Vercel** mediante `@astrojs/vercel`, runtime **Node 24**.
- **Supabase**: Postgres, Auth, políticas RLS y Storage.
- HTML/Astro, CSS y JavaScript/TypeScript nativo. No hay React, Vue ni Tailwind en las dependencias actuales.
- El contenido publicado se consulta durante las peticiones. Una edición en CMS no requiere reconstruir el sitio.
- WordPress, plugins PHP, FTP y HostGator pertenecen a documentación histórica. No son el backend ni el despliegue actuales.

```text
Visitante → páginas Astro SSR → src/services → Supabase (cliente anon + RLS)
                                   ↓
                         modelos normalizados → componentes

Administrador → /admin → cookies + Supabase Auth + profiles.role
                       → formularios POST + CSRF + validación de servidor
                       → Postgres / Storage con sesión de usuario y RLS

Scripts de migración → service role → operaciones administrativas de datos/media
```

## 2. Entorno y comandos

### Requisitos

- Node **24.x**, indicado en `package.json` y `.nvmrc`; npm y `package-lock.json`.
- Supabase CLI solamente para operaciones de base de datos. No es una dependencia npm del proyecto.
- Python solamente para scripts específicos de migración. Los importadores del Excel requieren `openpyxl`; el importador canónico también usa Pillow (`PIL`). No son requisitos para arrancar Astro.
- Los archivos de media originales pueden existir solo en una máquina local; no asumir que estarán en un clon limpio.

### Desarrollo local

```sh
npm ci
npm run dev
```

Crear `.env` a partir de `.env.example` y completar los valores del entorno correspondiente. Astro carga el entorno durante desarrollo/build. Los scripts Node independientes tienen su propio mecanismo de carga; revisar el script o usar `node --env-file=.env` cuando proceda.

| Variable | Uso |
| --- | --- |
| `SUPABASE_URL` | URL del proyecto Supabase usado por la aplicación. |
| `SUPABASE_ANON_KEY` | Cliente público de lectura y cliente SSR autenticado; RLS determina permisos. |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts administrativos y fixtures de integración. No se necesita para el funcionamiento normal del CMS. |
| `env=development` | Entrada del ejemplo; no sustituye a `import.meta.env.DEV/PROD` de Astro. |

No copiar valores de `.env`, sesiones, tokens ni datos de `.vercel/` o `supabase/.temp/` a documentación, código cliente o commits. No añadir prefijo `PUBLIC_` a secretos. Las credenciales del administrador tampoco forman parte del repositorio.

Sin configuración Supabase hay fallbacks públicos locales, pero el administrador requiere Supabase. Arrancar con fallbacks no prueba Auth, RLS ni la integración real.

### Verificación de código

```sh
npm test
npx astro check
npm run build
```

- `npm test`: `node --test tests/*.test.mjs`; usa el runner nativo de Node e importa módulos `.ts` directamente. Mantener Node 24.
- `npx astro check`: validación de Astro y TypeScript. No hay script npm `check`, `lint` ni `format` configurado.
- `npm run build`: compilación con adaptador Vercel. Un build correcto no demuestra que la base remota tenga todas las migraciones.
- `npm run preview`: script disponible (`astro preview`); la posibilidad de previsualizar el resultado SSR depende del adaptador. Para desarrollo ordinario usar `npm run dev`.
- Astro usa normalmente `http://localhost:4321`; comprobar el puerto anunciado por el proceso.

En PowerShell 5.1 ejecutar comandos separados o usar condicionales; `&&` no está disponible. Citar rutas con espacios. No incluir rutas absolutas personales en código nuevo.

## 3. Mapa del repositorio

| Ruta | Responsabilidad |
| --- | --- |
| `astro.config.mjs` | Adaptador Vercel, dominios permitidos, controles de origen y configuración de assets. |
| `tsconfig.json` | Extiende `astro/tsconfigs/strict`. |
| `src/pages/` | Rutas públicas, composición HTML, metadatos y consultas SSR. |
| `src/pages/admin/` | Login, logout, dashboard, configuración, CRUD y endpoint de subida de archivos de apoyo. |
| `src/middleware.ts` | Protección `/admin`, controles de origen y cabeceras de caché. |
| `src/components/layout/` | `SiteHeader`, `SiteFooter` y `WhatsAppFloat`. |
| `src/components/index/` | Hero, categorías, productos populares, proyectos y sucursales del inicio. |
| `src/components/productos/` | `ProductCatalogPage`, `ProductDetailPage`, `ProductCalculator`. |
| `src/components/products/` | Cards, grid, filtros, paginación y megamenú. Coexiste con `productos/`; respetar ambos nombres. |
| `src/components/projects/` | Listado, detalle y representación visual de proyectos. |
| `src/components/locations/`, `src/components/contact/` | Páginas de sucursales y contacto. |
| `src/components/admin/TechnicalFields.astro` | Campos técnicos guiados de productos. |
| `src/layouts/AdminLayout.astro` | Layout del panel, navegación y recursos administrativos. |
| `src/services/` | Acceso público a Supabase y normalización de productos, proyectos, ubicaciones y configuración. |
| `src/lib/` | Clientes Supabase, autenticación, seguridad, formularios, media, archivos de apoyo, agentes y calculadora. |
| `src/scripts/adminForms.ts` | Interacciones/progreso de formularios y subidas del panel. |
| `src/scripts/adminVideoSettings.ts` | Subida directa del video de inicio. |
| `src/types/` | Contratos de productos, proyectos y ubicaciones; no son tipos de base generados. |
| `src/data/` | Productos y proyectos locales de respaldo/demostración. |
| `src/styles/global.css`, `src/styles/admin.css` | Sistema visual público y estilos del panel. También hay estilos locales en componentes. |
| `public/assets/` | Fotos estáticas, logo, favicon, videos y scripts públicos. Se sirven desde `/assets/`. |
| `public/assets/scripts/deco-motion.js` | Animaciones/interacciones compartidas mediante atributos `data-*`. |
| `supabase/migrations/` | Fuente versionada del esquema, políticas, triggers y evolución de datos. |
| `supabase/tests/admin_cms.sql` | Pruebas de permisos/publicación/limpieza en transacción. |
| `tests/` | Pruebas unitarias de validación y calculadora. |
| `scripts/` | Migraciones, importación, transformación de imágenes y prueba integrada del CMS. |
| `docs/` | Operación del panel, productos e informes de migración. |
| `mockup/` | Referencias de diseño; no son las rutas ejecutadas por Astro. |

Generados o locales: `node_modules/`, `dist/`, `.astro/`, `.vercel/`, `supabase/.temp/`. No editarlos como fuente. `CATALOGO_DECO/`, `src/types/CATALOGO_DECO/`, `IMAGENES FONDO BLANCO PARA WEB/` y `auditoria-saro-deco/` están ignorados por Git. Buscar código por extensión/ruta específica para evitar recorrer miles de imágenes.

## 4. Rutas y navegación

### Públicas

| URL | Implementación / notas |
| --- | --- |
| `/` | `src/pages/index.astro` y componentes `index/`. Hero de video y secciones comerciales. |
| `/productos` | Catálogo por familia mediante `getCatalogProducts()`. |
| `/productos/[slug]` | Una ficha por acabado/color. Consulta `getProductBySlug()`. 404 real si no existe/no es visible. |
| `/proyectos` | Listado con `getProjects()`. |
| `/proyectos/[slug]` | Ficha con `getProjectBySlug()`, 404 si la consulta no devuelve proyecto. |
| `/ubicaciones` | Sucursales, catálogos, mapas y agentes comerciales. |
| `/contacto` | Canales de contacto y formulario visual. |
| `/busqueda` | Búsqueda de acabados a partir de `getProducts()`, parámetros `q` y `area`. |

Las páginas actuales declaran `export const prerender = false`. No convertirlas a prerender estático: se perdería la actualización inmediata del CMS. `src/middleware.ts` añade `Cache-Control: no-store` a respuestas públicas.

El catálogo usa filtros del navegador y parámetros `categoria`, `familia`, `subcategoria`, `q`, `orden`, `page`. La categoría inicial es Interior; las pestañas de uso son Interior y Exterior. Hay 12 resultados por página. Mantener enlaces profundos y sincronización entre URL y controles.

No hay rutas públicas individuales de categorías, tipos, familias ni sucursales. Sus campos SEO guardados no implican que existan esas páginas.

### Administrativas

- `/admin/login`, `/admin/logout`, `/admin`: acceso, cierre de sesión y dashboard.
- `/admin/productos`: listado especializado en `src/pages/admin/productos/index.astro`, paginado de 8; `?vista=familias`, `?vista=acabados` y `?familia={uuid}`.
- `/admin/categorias`, `/admin/familias`, `/admin/variantes`, `/admin/proyectos`, `/admin/ubicaciones`: CRUD común en `src/pages/admin/[...path].astro`.
- Las altas usan `/nuevo` (ubicaciones, `/nueva`) y la edición `/{uuid}`. Los listados comunes paginan de 25 en 25.
- `/admin/configuracion`: WhatsApp global, visibilidad global de secciones de producto y video del hero.
- `POST /admin/support-upload`: preparar/confirmar subida firmada de archivos de apoyo; no es una pantalla pública.

## 5. Modelo de datos y nomenclatura comercial

**Los nombres históricos de tablas/rutas no coinciden siempre con las etiquetas visibles.**

```text
categories                         categoría de uso: Interior / Exterior
  └─ products                      tipo de producto: Lambrín, Piso SPC, Accesorios...
       └─ product_variants         familia/subcategoría: Premium 4, Madera...
            ├─ product_options    acabado/color: Roble, Sirope... (slug público propio)
            │    └─ product_images (el CMS de acabados usa option_id)
            └─ product_support_files (compartidos por todos los colores de la familia)

projects ── project_images
locations ── location_agents
profiles                           rol de usuarios Auth
site_settings                      configuración key/value y bandera is_public
media_cleanup_queue                limpieza reintentable de objetos de Storage
```

| Pantalla | Tabla real |
| --- | --- |
| Categorías (`/admin/categorias`) | `categories` |
| Tipos de producto (`/admin/familias`) | `products` |
| Familias/subcategorías (`/admin/variantes`) | `product_variants` |
| Acabados/colores (`/admin/productos`) | `product_options` |

### Inventario y publicación

- La fuente de la importación canónica es `DECO_ABC_Plantilla_Inventario_Productos (1).xlsx`. El informe registra **160 combinaciones únicas** y elimina el duplicado `ACCESORIOS / Soclo SPC / Humo`.
- `inventario.json` e `inventario_final.json` pertenecen al inventario inicial; no reemplazan la importación canónica ni las ediciones posteriores del CMS.
- Los 160 registros son un dato de la migración, no un conteo remoto comprobado en cada sesión ni una constante que deba imponerse en la UI.
- El nombre de `product_options` debe contener el acabado/color, sin repetir tipo/familia. SKU es opcional.
- El catálogo agrupa con `groupProductsByVariant()`: tarjeta por familia, colores reunidos y conservación de la URL individual de cada acabado. `getProducts()` devuelve acabados; `getCatalogProducts()` devuelve agrupaciones. No intercambiarlos sin revisar consumidores.
- `Product` en `src/types/products.ts` es el modelo de UI normalizado, no una fila de `products`.
- `productService.ts` también normaliza nombres comerciales históricos. Revisar `catalogFamilies` y `catalogVariantNames` al cambiar taxonomía.
- Estados: `draft` / `published`. RLS exige publicación de los ancestros para exponer un acabado. Una categoría/tipo/familia en borrador oculta sus descendientes.
- Mantener slugs existentes salvo cambio explícito; el panel exige confirmación para cambiarlos. No existen redirecciones automáticas de slugs anteriores.
- `summary` y `description` de acabado usan valores de familia/tipo como respaldo mediante la normalización del servicio.
- `sort_order`, `featured`, SEO y relaciones deben preservarse durante edición/importación. Las relaciones incluyen borrados en cascada: revisar impacto antes de eliminar padres.

### Precio y unidad comercial

- `product_options.price`: precio de mayoreo individual; el valor `$1.00` de la importación es temporal, no un precio comercial certificado.
- `product_variants.price_presentation`: `Caja`, `Pieza` o `null`; controla «por caja»/«por pieza» en todas las fichas de esa familia.
- No confundir `price_presentation` con `technical_specs.presentation`: uno etiqueta el precio y el otro describe la presentación técnica usada por la calculadora.

## 6. Calculadora y ficha técnica

La lógica compartida está en `src/lib/productCalculator.ts`; el admin usa `getProductCalculator()` para su diagnóstico y el sitio lo usa para mostrar la calculadora. La UI vive en `src/components/productos/ProductCalculator.astro`.

Datos relevantes de `product_options`:

```json
{
  "dimensions": "290 x 10 cm",
  "technical_specs": {
    "presentation": "Caja",
    "pieces_per_box": "10 piezas",
    "coverage": "4.60 m²",
    "weight": "2 kg",
    "water_resistance": "Texto comercial",
    "fire_classification": "Texto comercial"
  }
}
```

- `coverage`: rendimiento **comercial por presentación**, con unidad `m²`; no inferirlo multiplicando dimensiones. El admin acepta `N/A` para ausencia de rendimiento.
- `pieces_per_box`: entero con sufijo `piezas` o `N/A`; en ausencia de cantidad válida se usa una unidad por presentación.
- `dimensions`: primer número en centímetros = largo para productos lineales. Se conserva `290 x 10*5 cm` como dimensión heredada: `10*5` es una sección transversal, no una operación para derivar cobertura.
- Área: `presentaciones = ceil(área solicitada / cobertura)` y `unidades = presentaciones × piezas por presentación`.
- Lineal: redondear primero piezas por largo, y luego presentaciones cuando haya empaque; cobertura final = piezas entregadas × largo.
- Las familias lineales se reconocen por slugs/nombres en `isLinearProduct()` (vigas, ángulos ASA/coextruido y quilla WPC). La exclusión de accesorios/grapa deck se evalúa antes.
- Ocultar calculadora cuando faltan datos válidos o el tipo está excluido. No inventar cobertura ni agregar merma automática.
- Al modificar parsers/reglas, revisar a la vez validación de `adminContent.ts`, diagnóstico admin, UI y `tests/product-calculator.test.mjs` / `tests/admin-content.test.mjs`.
- Los campos guiados deben preservar claves técnicas adicionales del JSON y valores heredados sin modificar. No sobrescribir datos no incluidos en el formulario.

Visibilidad global en `site_settings`:

- `product_section_technical_enabled`: «Especificaciones del producto».
- `product_section_support_enabled`: «Documentos en la galería».
- `product_section_faq_enabled`
- `product_section_installation_enabled`

Las anulaciones por acabado están en `product_options.section_visibility`, con claves `technical`, `support`, `faq`, `installation`. Clave ausente = heredar; `true` = mostrar; `false` = ocultar. Guardar «heredar» no debe materializar el valor global actual. Las FAQ son un objeto pregunta → respuesta (`faq_items`) y los pasos de instalación son texto con una línea por paso (`installation_notes`).

## 7. CMS, autenticación y formularios

Archivos centrales:

- `src/lib/supabase.ts`: cliente anon para servicios públicos, sin persistencia de sesión; genera URLs de Storage con parámetro de versión de assets.
- `src/lib/supabaseServer.ts`: cliente SSR con cookies, reutilizado por petición mediante `WeakMap<Request, SupabaseClient>`.
- `src/lib/adminAuth.ts`: `auth.getUser()` y verificación de `profiles.role === 'admin'`.
- `src/lib/adminSecurity.ts`: CSRF, redirecciones internas, validación de origen y cabeceras.
- `src/lib/adminContent.ts`: `contentModules`, relaciones, definición de campos y `parseContentForm()`.
- `src/pages/admin/[...path].astro`: aplica las operaciones reales y confirmaciones.

Reglas para extensiones:

1. Operar con anon key + sesión del usuario y RLS, nunca service role desde páginas/endpoints del panel.
2. Validar en servidor identificadores, URLs, estados, números, JSON y pertenencia a la entidad editada. Los controles del navegador son complementarios.
3. Proteger POST con token `csrf_token` y sesión. No realizar escrituras desde GET.
4. Mantener confirmaciones de borrado/cambio de slug y comprobaciones de relaciones.
5. Mantener cookies HTTP-only y cookies seguras en producción; logout debe respetar el flujo existente.
6. No habilitar registro público ni asignación de rol desde formularios del sitio.

Para crear el primer administrador: crear usuario email/password en Supabase Auth y asignar su UUID a `profiles` con rol `admin`. SQL de referencia con valores de ejemplo en `SUPABASE_CMS.md`, sección «Primer admin». No registrar contraseñas en documentación.

### Origen, CSP y Vercel

- `astro.config.mjs` desactiva el `security.checkOrigin` general de Astro; el middleware implementa la validación específica de POST administrativos en producción. No eliminar ese control manual.
- `isAdminSecurityRelaxed()` depende de `import.meta.env.DEV`; un resultado en desarrollo no prueba la política de producción.
- Conservar `Referrer-Policy: strict-origin-when-cross-origin`. Usar `no-referrer` puede provocar `Origin: null` y bloquear el login.
- La CSP administrativa permite scripts de `'self'`, no scripts inline arbitrarios. `vite.build.assetsInlineLimit: 0` evita inlining de assets. Usar los scripts procesados/externos existentes.
- La conexión de subidas firmadas a Supabase está permitida por `connect-src`; las vistas previas PDF usan `frame-src` limitado a self y Supabase. No romper estos permisos al modificar CSP.
- `security.allowedDomains` contiene localhost, `127.0.0.1`, `deco-site-kappa.vercel.app` y subdominios de Vercel. Revisarlo cuando se configure un dominio definitivo.
- Las cabeceras admin incluyen no-cache/no-store, bloqueo de frames y controles de contenido. Revisar también `AdminLayout.astro` para metadatos del panel.

## 8. Imágenes, archivos de apoyo y video

El bucket **`site-media` es público**. RLS limita acceso a registros y escrituras, pero no vuelve privado un archivo cuya URL pública ya se conoce.

### Fotos de productos/proyectos

- `src/lib/adminMedia.ts`: JPEG, PNG o WebP, hasta **4 MB** por archivo; decodificación Sharp, límite de **40 megapíxeles**, orientación corregida y WebP hasta **2400 × 2400** sin ampliar.
- Rutas nuevas bajo `products/{slug}/` o `projects/{slug}/`; reemplazar genera otra ruta para evitar caché antigua.
- Tipos de imagen de producto: `main`, `swatch`, `secondary`, `gallery`, `extra`, `technical`. `swatch` identifica la muestra independiente de los círculos de variantes; si falta, se usa la principal. `technical` es una imagen de medidas, no el PDF técnico. Proyectos: `main`, `gallery`, `before`, `after`.
- La selección compartida vive en `src/lib/productMedia.ts`: principal y muestra por tipo y menor orden; empates por UUID. La secundaria efectiva ocupa la primera miniatura; otras fotos conservan orden relativo. Las muestras no se añaden a la galería. Conservar texto alternativo. El visor permite intercambiar fotos y regresar a la principal.
- Nuevos acabados reciben `products/_placeholder/product-placeholder.webp` como fallback compartido.
- La ruta `original_source_path` es procedencia local para migraciones, no una URL pública para renderizar.
- Los triggers encolan objetos eliminados/reemplazados en `media_cleanup_queue`. La limpieza verifica referencias antes de borrar Storage; fallos quedan pendientes y son reintentables. El lote manual es de 20.
- No borrar archivos compartidos o placeholders solo porque desaparece una referencia.

### Archivos de apoyo de familias

- `src/lib/adminSupportFiles.ts`, `src/pages/admin/support-upload.ts` y `src/scripts/adminForms.ts` implementan el flujo.
- Asociados a `product_variants` mediante `product_support_files`, no a un solo color. Se administran desde familia o acabado.
- Solo PDF, título obligatorio de hasta 160 caracteres y orden editable. Rutas `support/{variant_id}/`.
- Hasta **15 MB** mediante subida directa firmada navegador → Storage. Vercel recibe autorización/confirmación, no el archivo grande.
- Sin JavaScript, formulario convencional limitado a **4 MB**.
- Estados de subida pendientes/disponibles; el servicio público solo expone `upload_state === 'ready'` después de validación de tamaño/cabecera.
- La familia selecciona explícitamente su ficha técnica con `product_variants.technical_support_file_id`; una FK compuesta impide seleccionar un archivo de otra familia y borra la selección al eliminar el PDF. El POST valida UUID, pertenencia y estado `ready`. La migración preselecciona únicamente PDF existentes cuyo título indica «Ficha técnica». Se administra desde familia o acabado, siempre compartido por todos los colores. La ficha individual integra el PDF seleccionado en la galería, respetando la visibilidad de apoyo; otros archivos se ofrecen como enlaces. La ficha técnica ocupa la segunda miniatura; seleccionarla carga el PDF en el visor principal y pulsar el visor abre el documento completo en otra pestaña. Sin PDF no se muestra una miniatura documental. La sección independiente de información técnica/material de apoyo fue retirada; las especificaciones comerciales se conservan.
- `technical_sheet_url` y `installation_guide_url` se conservan como datos legados, pero **la UI actual no los ofrece como respaldo ni permite editarlos en el formulario de acabado**. Los tests exigen no sobrescribir esos valores históricos.

### Sucursales y agentes

- `locations.catalog_url` configura el catálogo de cada sucursal y alimenta el submenú «Catálogo» del header.
- `location_agents` contiene nombre, teléfono, foto, orden y estado de cada asesor; gestión desde la sucursal con `src/lib/adminLocationAgents.ts`.
- Fotos de agentes: hasta 4 MB, JPEG/PNG/WebP, límite 20 megapíxeles, WebP recortado a 900 × 900, ruta `locations/agents/{location_id}/`.
- `locationService.ts` crea enlaces de mapa a partir de URL, coordenadas o dirección y contiene compatibilidad de lectura con esquemas antiguos.

### Video del inicio

- Clave `site_settings.home_hero_video_url`; fallback `/assets/videos/header-hero.mp4`.
- Subida MP4 de hasta **50 MB**, directa firmada a `settings/home-hero/{uuid}.mp4`.
- `configuracion.astro` maneja `prepare-video` y `finish-video`, comprueba archivo/tamaño/MIME y guarda la URL tras confirmar.
- No intentar hacer pasar estos archivos grandes a través del body de una función Vercel.

## 9. Migraciones y scripts operativos

El esquema se reconstruye aplicando **todas** las migraciones en orden; la primera no contiene todos los campos del CMS actual.

| Migración | Cambio principal |
| --- | --- |
| `20260918120000_cms_schema.sql` | Entidades base, perfiles, Storage y RLS. |
| `20260920100000_site_settings.sql` | Configuración del sitio. |
| `20260920120000_product_technical_data.sql` | Datos técnicos/comerciales y visibilidad. |
| `20260920150000_admin_completion.sql` | FAQ, publicación por ancestros y cola de limpieza. |
| `20260921100000_canonical_inventory_fallback.sql` | Imagen de respaldo del inventario canónico. |
| `20260921110000_normalize_product_option_color_names.sql` | Nombres de acabado/color. |
| `20260921130000_product_support_files.sql` | Archivos de apoyo por familia. |
| `20260921150000_admin_support_uploads.sql` | Estados de subida y limpieza de archivos de apoyo. |
| `20260922120000_location_catalog_urls.sql` | Catálogo por sucursal. |
| `20260922130000_home_hero_video_setting.sql` | Video del hero y configuración asociada. |
| `20260922140000_location_agents.sql` | Agentes de sucursal, fotos, políticas y limpieza. |
| `20260924100000_variant_price_presentation.sql` | Unidad del precio por familia, `Caja` / `Pieza`. |
| `20260930120000_product_gallery_roles.sql` | Muestra de color independiente (`swatch`) y PDF técnico seleccionado por familia. |

Para cambios nuevos de esquema, añadir una migración fechada en `supabase/migrations/`, actualizar consumidores y revisar RLS/triggers. No asumir que editar una migración ya aplicada modifica el servidor remoto.

```sh
npm run supabase:push
```

Equivale a `supabase db push`. Requiere CLI autenticada y proyecto destino vinculado. Confirmar el destino y el alcance antes de ejecutarlo: modifica la base vinculada. Los informes históricos de «aplicada» no prueban el estado del entorno actual.

### Inventario de comandos con efectos sobre datos

| Comando/script | Función y precaución concreta |
| --- | --- |
| `npm run supabase:setup` | Migraciones + seed histórico + imágenes. **No es el arranque ordinario del proyecto actual.** |
| `npm run supabase:setup:no-images` | Migraciones + seed histórico, omite imágenes. También modifica datos. |
| `npm run supabase:seed:inventory` | Importa `inventario_final.json`, no el Excel canónico. Revisar sus `upsert` antes de usarlo. |
| `npm run supabase:migrate:product-data` | Script Python para importar datos técnicos. |
| `npm run supabase:migrate:canonical-inventory` | Migración Python del inventario canónico; puede modificar publicación y datos existentes. |
| `npm run supabase:upload:product-images` | Convierte originales locales, sube WebP y actualiza metadatos/rutas con `upsert`. |
| `npm run supabase:upload:product-support` | Sube archivo a una familia; acepta ruta y nombre de familia como argumentos. Revisar defaults del script. |
| `npm run supabase:transparent:black` | Analiza eliminación de fondo negro; por defecto es simulación. `-- --apply` reemplaza objetos en su misma ruta; admite `--limit=` y `--threshold=`. |
| `scripts/restore-canonical-images.py` | Restauración/mapeo de imágenes canónicas. Revisar manifiestos y escrituras antes de usar. |
| `scripts/seed-site-content.mjs` | Seed adicional de contenido del sitio; no se ejecuta como parte de desarrollo normal. |
| `scripts/inspect-product-image-alpha.mjs` | Inspección de transparencia de un objeto; argumento de ruta y opción `--public`. |

Los scripts masivos no son comandos de prueba de la UI. Ejecutarlos solo cuando la tarea requiera esa operación y después de revisar fuente/destino y contenido que se puede sobrescribir. No reimportar inventario para solucionar un error de CSS, login o renderizado.

## 10. Convenciones de implementación

- Páginas para composición/rutas/SEO; componentes para UI; servicios para consultas y normalización; `lib` para lógica compartida. Seguir el patrón próximo al código modificado.
- Conservar TypeScript estricto, tipos de props y modelos de `src/types`. Evitar introducir `any` o dependencias grandes para resolver tareas pequeñas.
- Código ESM (`"type": "module"`); scripts Node `.mjs`. Respetar convenciones de imports del archivo, especialmente módulos importados directamente por las pruebas Node.
- Nombres de código generalmente en inglés, rutas y texto comercial en español. No traducir ni renombrar tablas/rutas históricas en cambios cosméticos.
- Estilos públicos: variables en `global.css`, paleta negro/blanco, azul y verde; tipografía Arial/sistema. Revisar también `<style>` del componente antes de añadir overrides globales.
- Mantener HTML semántico, labels, navegación por teclado, atributos ARIA, textos alternativos y comportamiento móvil.
- Conservar atributos `data-*` usados por filtros, galerías, formularios y animaciones. Un cambio de markup puede romper scripts aunque compile.
- Respetar animaciones y preferencias de movimiento reducido; usar las clases y mecanismos existentes.
- Los componentes usan comentarios `<!-- Seccion: ... -->` para bloques editables; seguir ese patrón cuando sea útil.
- Mantener `lang="es"`, títulos, descripción, canonical y Open Graph donde existen. No transformar errores de consulta en falsas respuestas 404.
- Usar URLs reales de Storage desde servicios. No inventar equivalencias entre fotos de colores parecidos ni reemplazar nombres canónicos por nombres de carpetas.
- No editar outputs ni reformatear archivos ajenos al objetivo. No ejecutar commits, push o despliegues salvo petición del usuario.

## 11. Pruebas y criterios de cierre

### Unitarias y compilación

- `tests/admin-content.test.mjs`: JSON, URLs, UUID, slugs, precios, estados, presentación comercial, conservación de enlaces legados, herencia de visibilidad, coordenadas y formatos técnicos.
- `tests/product-calculator.test.mjs`: interpretación y cálculo de rendimiento comercial/lineal.
- Para lógica/admin/modelos: ejecutar unitarias, `npx astro check` y build. Añadir casos de regresión cuando cambie comportamiento sustancial.
- Para UI: check/build y comprobación visual de la ruta afectada en escritorio y móvil, incluyendo filtros/menús o formularios modificados.
- Para documentación sola: verificar nombres, rutas, comandos y diff; no hace falta escribir tests ni modificar la aplicación.

`tests/product-media.test.mjs` comprueba usos, orden estable, muestras, secundaria, PDF explícito y visibilidad. `supabase/tests/product_gallery.sql` prueba roles de imagen, guardado de orden, pertenencia del PDF, RLS, limpieza y cascadas en transacción.

### RLS y prueba integrada (con entorno adecuado)

```sh
supabase db query --linked --file supabase/tests/admin_cms.sql
node --env-file=.env scripts/test-admin-integration.mjs
```

- El SQL prueba escritura admin, bloqueo anónimo, borradores/ancestros y limpieza en cascada. Finaliza con `ROLLBACK`; aun así se ejecuta sobre la base vinculada.
- La prueba integrada usa service role para preparar/retirar fixtures, arranca servidor local en **4397**, crea usuario temporal y prueba login, permisos, formularios, publicación, CSRF, media, PDF y logout.
- Modifica temporalmente Supabase y Storage; no ejecutarla en paralelo con otra instancia. Una interrupción puede dejar fixtures `cms-smoke-` para retirar.
- Leer el script antes de ampliarlo. No confundir esta integración HTTP con una suite visual de navegador.

Al cerrar una tarea, informar de comandos realmente ejecutados y sus resultados. Si faltan credenciales, CLI, conexión o entorno de navegador, describir exactamente la validación pendiente. No presentar un build local como verificación de producción.

## 12. Comportamiento actual que difiere de documentos antiguos

Estas diferencias se verificaron en el código y son importantes para no introducir regresiones ni diagnosticar desde premisas equivocadas:

1. **Proyectos vacíos:** `README.md` y documentos de CMS dicen que se mantienen vacíos. Actualmente `getProjects()` devuelve `projectPlaceholders` también cuando Supabase responde sin proyectos publicados. Son cuatro ejemplos definidos en `src/data/projects.ts`. En cambio, con Supabase configurado, `getProjectBySlug()` no usa ese fallback al faltar una fila; un enlace del listado de ejemplo puede acabar en 404. Tratarlo como discrepancia existente, no como permiso para cambiarlo fuera del alcance de la tarea.
2. **Productos vacíos:** con Supabase configurado se conserva el arreglo vacío; errores de consulta se propagan. El fallback local se usa sin configuración.
3. **Ubicaciones vacías:** se muestran dos sucursales locales (Mérida y Playa del Carmen). Los teléfonos de ejemplo no son una fuente de datos comerciales verificados. Consultar `locationService.ts`.
4. **Catálogos:** el header usa `locations.catalog_url`, no la antigua configuración global `site_settings.catalog_url`. `/admin/configuracion` ya no edita ese catálogo global.
5. **Enlaces documentales legados:** algunos documentos dicen que `technical_sheet_url` funciona como respaldo y es editable. La ficha actual usa únicamente archivos de apoyo subidos; el formulario excluye esos enlaces y los conserva al editar.
6. **Contacto:** `ContactPage.astro` contiene un formulario POST visual, pero `src/pages/contacto.astro` no implementa envío de correo/persistencia. No afirmar que una solicitud llega a un buzón sin implementar y probar esa integración.
7. **Estado remoto:** los informes de migración contienen conteos y UUID de su ejecución. No demuestran el inventario, usuarios, imágenes pendientes ni migraciones aplicadas hoy.

## 13. Dónde hacer cambios habituales

| Necesidad | Archivos a revisar primero |
| --- | --- |
| Inicio/hero | `src/pages/index.astro`, `src/components/index/`, `siteSettingsService.ts`. |
| Navegación, catálogo de sucursal, pie | `src/components/layout/`, `locationService.ts`, `siteSettingsService.ts`. |
| Cards, filtros, orden y agrupación | `productService.ts`, `ProductCatalogPage.astro`, `src/components/products/`. |
| Ficha/precio/colores/SEO | `src/pages/productos/[slug].astro`, `ProductDetailPage.astro`, `src/types/products.ts`, `productService.ts`. |
| Nuevo campo editable | Migración + `adminContent.ts` + formulario apropiado + tipos/servicio + renderizado + pruebas. |
| Calculadora | `productCalculator.ts`, `ProductCalculator.astro`, `TechnicalFields.astro`, validadores y tests. |
| Login/origen/cookies | `middleware.ts`, `adminSecurity.ts`, `adminAuth.ts`, `supabaseServer.ts`, `admin/login.astro`. |
| Fotos/galerías | `adminMedia.ts`, formulario CRUD, tipos/servicios y triggers de limpieza. |
| Archivos de apoyo | `adminSupportFiles.ts`, `support-upload.ts`, `adminForms.ts`, `productService.ts`, ficha. |
| Sucursales/asesores | `adminLocationAgents.ts`, `adminContent.ts`, `locationService.ts`, `LocationsPage.astro`. |
| Video del hero | `admin/configuracion.astro`, `adminVideoSettings.ts`, `siteSettingsService.ts`, `HeroSection.astro`. |
| Búsqueda | `src/pages/busqueda.astro`, `getProducts()` y su modelo normalizado. |
| Deploy/dominio | `astro.config.mjs`, Node 24 y variables del proyecto Vercel; después comprobar SSR y login. |

## 14. Documentación de apoyo y precedencia

Lectura operativa:

- `README.md`: resumen e inicio rápido; contrastar las excepciones indicadas arriba.
- `docs/admin-cms.md`: operación, medios, protección y pruebas; refleja principalmente el cierre de septiembre 20–21.
- `docs/product-admin.md`: relación del inventario, datos técnicos y visibilidad; contrastar enlaces legados con el código actual.
- `SUPABASE_CMS.md`: configuración, primer administrador y migraciones. Su setup de inventario inicial es histórico.
- `docs/canonical-inventory-migration-report.md`: resultado de importación canónica.
- `docs/canonical-image-mapping-report.md`, `docs/canonical-image-migration-final-report.md` y sus JSON/manifiesto: trazabilidad de equivalencias y migración de imágenes.
- `docs/faltantes-imagenes-marketing.csv`: faltantes registrados en la auditoría, no necesariamente el estado remoto actual.
- `especificacion-calculadora-materiales-deco-abc.md`: intención funcional de la calculadora; la implementación y pruebas determinan las reglas activas.

Contexto histórico, no instrucciones de arquitectura vigente:

- `DECO_PROJECT_CONTEXT.md`, `DECO_PROJECT_REFERENCE_CONTEXT.md`, `DECO_PROJECT_IMPLEMENTATION_PROGRESS.md`.
- `contexto-agente-supabase-cms-deco.md`, `contexto-codex-cms-deco.md`, `contexto-siguiente-sesion-admin-cms-deco.md`.
- `HOSTGATOR_DEPLOY_CONTEXT.md`, `HOSTGATOR_FTP_CONTEXT.md`, `HOSTGATOR_NUEVO_PROYECTO_LECCIONES.md`.
- `wordpress-headless.md`, `PLUGIN_CHANGE_CONTEXT.md`, `WP_MEDIA_LIBRARY_MIGRATION_CONTEXT.md`.
- `PRODUCTOS_IMPLEMENTATION_PLANNING_CONTEXT.md`, `productos-mila-web-migration-context.md` y prompts de auditoría antiguos.

Si una tarea requiere recuperar una decisión anterior, consultar esos documentos de forma dirigida. No ejecutar comandos de otros proyectos, copiar sus credenciales ni volver a WordPress/FTP por una instrucción histórica. Para desarrollar ahora, priorizar la petición actual, esta guía y la evidencia del código/migraciones; señalar cualquier discrepancia nueva y mantener el contexto actualizado.
