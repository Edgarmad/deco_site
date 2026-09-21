# Admin CMS — implementación y operación

Actualizado: 2026-09-20.

## Arquitectura verificada

El panel usa Supabase Auth email/password con cookies HTTP-only y validación del rol `admin` en servidor. Cada operación usa la clave anon más la sesión del usuario; la service role no forma parte de las páginas del panel. Formularios con CSRF, controles de origen en producción, confirmación de eliminaciones y de cambios de slug, cabeceras no-store/noindex y RLS.

La relación de productos es:

```text
categories → products (familias) → product_variants → product_options (acabados con URL propia)
                                                       ↓
                                                 product_images
projects → project_images
locations
site_settings
```

## Qué se puede administrar

| Módulo | Ruta | Operaciones |
| --- | --- | --- |
| Acabados/productos | `/admin/productos` | Crear, buscar por nombre/slug/SKU, filtrar, paginar, editar, publicar, borrar, SEO, precio, especificaciones, FAQ, instalación, visibilidad y media |
| Categorías | `/admin/categorias` | Crear, editar, publicar, ordenar y borrar si no contienen familias |
| Familias | `/admin/familias` | Crear, editar, reasignar categoría, publicar y borrar si no contienen variantes |
| Variantes | `/admin/variantes` | Crear, editar, reasignar familia, publicar y borrar si no contienen acabados |
| Proyectos | `/admin/proyectos` | CRUD, contenido, materiales, reto/resultado, SEO, estados y galería |
| Ubicaciones | `/admin/ubicaciones` | CRUD, ciudad/sucursal, dirección, horarios, teléfono, WhatsApp, mapa y coordenadas |
| Configuración | `/admin/configuracion` | WhatsApp global, URL del catálogo del menú y visibilidad global de secciones |

Los listados adicionales tienen búsqueda por nombre, estado y páginas de 25 registros. El listado visual de productos conserva páginas de 8. Crear usa `/nuevo` (`/nueva` para ubicaciones); editar usa `/{uuid}`. Los selectores de relaciones muestran el estado de los padres y, para acabados, familia + variante. Están dimensionados al catálogo actual (hasta 1000 opciones por selector).

### Publicar un acabado

1. Crear o elegir una categoría publicada.
2. Crear o elegir una familia publicada dentro de ella.
3. Crear o elegir una variante publicada.
4. Crear el acabado, guardar y añadir imágenes.
5. Publicar el acabado y abrir su URL pública.

Un padre en borrador oculta sus descendientes, incluso en la API pública de Supabase. Despublicar o borrar una ficha hace que su URL responda 404. Los fallos de consulta se propagan como errores; no se convierten en catálogo ficticio ni en falsas fichas inexistentes.

Los slugs existentes se conservan salvo edición explícita confirmada. No hay redirecciones automáticas para slugs anteriores.

Las descripciones/resúmenes de variantes y familias se usan como respaldo cuando el acabado no tiene un valor propio. La ficha técnica y guía aceptan enlaces HTTP(S). Las especificaciones se editan como objeto JSON de valores simples. `faq_items` usa un objeto pregunta → respuesta. Las instrucciones de instalación se capturan como texto, un paso por línea.

Las secciones individuales admiten **heredar**, **mostrar** u **ocultar**. Heredar no guarda una anulación, por lo que futuros cambios globales sí afectan ese acabado.

## Imágenes

- JPEG, PNG o WebP; máximo 4 MB por archivo para ajustarse al límite de petición de Vercel.
- Validación de MIME y decodificación real con Sharp, límite de 40 megapíxeles.
- Conversión a WebP, corrección de orientación y reducción a un máximo de 2400 × 2400 sin ampliar.
- Rutas únicas bajo `products/{slug}/` o `projects/{slug}/` en `site-media`.
- Vista previa, progreso de subida, mensaje de procesamiento y errores recuperables.
- Tipo, texto alternativo y orden editables por imagen.
- La principal es la imagen `main` de menor orden; el resto forma la galería.
- Reemplazar genera una ruta nueva para evitar contenido antiguo en caché.
- Triggers registran rutas eliminadas/reemplazadas en `media_cleanup_queue`. La limpieza comprueba referencias antes de borrar Storage. Si Storage falla, el panel conserva y muestra la tarea pendiente; se puede reintentar con un POST protegido.
- No se ejecutan escrituras desde GET.

`site-media` sigue siendo un bucket público: conocer una URL permite descargar el archivo aunque el contenido esté en borrador. RLS protege los registros y las escrituras; el bucket no es almacenamiento privado para documentos confidenciales.

## Integración pública

Inicio, catálogo, búsqueda, fichas, proyectos, ubicaciones y contacto usan SSR. Contacto también necesita runtime para el menú y pie administrables. El inicio consulta categorías, productos, proyectos y ubicaciones reales. El pie ya usa enlaces de productos existentes. Las imágenes de proyectos se muestran en inicio, listado, ficha y galería; las de productos en la ficha y galería, respetando `alt_text`.

SEO title, description y canonical de acabados y SEO de proyectos se usan en los metadatos de sus fichas. Coordenadas de ubicaciones generan un enlace de mapa si no se capturó uno. Los campos SEO de categorías/familias/ubicaciones quedan guardados para futuras páginas individuales: hoy no existen rutas públicas individuales para esas entidades.

Los cambios publicados aparecen en la siguiente petición al sitio después de desplegar esta implementación. No hace falta rebuild por edición de contenido.

## Migración de cierre

`supabase/migrations/20260920150000_admin_completion.sql` agrega:

- `product_options.faq_items`.
- Cola y triggers de limpieza de media.
- RLS de publicación que respeta los ancestros del acabado.
- Valor inicial de `site_settings.catalog_url` sin sobrescribir uno existente.

Aplicada y verificada en el proyecto vinculado el 2026-09-20. Las tres migraciones anteriores ya estaban aplicadas. No se reejecutó el seed del inventario.

## Pruebas

```bash
npm test
npx astro check
npm run build
supabase db query --linked --file supabase/tests/admin_cms.sql
```

El SQL verifica escritura admin, bloqueo anónimo, ocultamiento de borradores y descendientes, y cola de limpieza tras borrado en cascada; todo dentro de una transacción que finaliza con ROLLBACK.

Prueba end-to-end opt-in:

```bash
node --env-file=.env scripts/test-admin-integration.mjs
```

Requiere service role para preparar y retirar fixtures. Arranca un servidor local en 4397, crea una cuenta admin temporal, prueba login, sesión, formularios reales, publicación, CSRF, imágenes, reemplazo, eliminación, logout y rechazo sin rol admin. Usa `finally` para retirar sus propios registros, archivos y usuario. No ejecutar en paralelo con otra copia de la misma prueba. Una interrupción forzada del proceso puede exigir retirar fixtures cuyo prefijo es `cms-smoke-`.

## Estado de contenido al cierre

La revisión remota encontró **0 proyectos, 0 ubicaciones y 0 perfiles admin**. Los datos locales anteriores no se publican como sustituto de estas tablas vacías. Para operar con una cuenta definitiva, crear el usuario Auth y asignar su perfil admin según `SUPABASE_CMS.md`; después capturar proyectos y ubicaciones reales desde el panel.

El usuario y los registros usados en la prueba end-to-end fueron retirados. El frontend requiere desplegar los cambios de este repositorio para que estas pantallas estén disponibles en Vercel.
