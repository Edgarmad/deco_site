# Admin CMS — implementación y operación

Actualizado: 2026-09-21.

## Arquitectura verificada

El panel usa Supabase Auth email/password con cookies HTTP-only y validación del rol `admin` en servidor. Cada operación usa la clave anon más la sesión del usuario; la service role no forma parte de las páginas del panel. Formularios con CSRF, controles de origen en producción, confirmación de eliminaciones y de cambios de slug, cabeceras no-store/noindex y RLS.

El panel usa `Referrer-Policy: strict-origin-when-cross-origin`. No cambiarla a `no-referrer`: un formulario POST puede enviar `Origin: null` y ser rechazado con «Origen no permitido» antes de validar las credenciales. La corrección requiere desplegar el código y recargar `/admin/login` para recibir la cabecera actualizada. El origen `null` y los orígenes externos siguen bloqueados.

La relación de productos es:

```text
categories (uso) → products (tipo) → product_variants (familia/subcategoría) → product_options (color con URL propia)
                                                       ↓
                                                 product_images
product_variants → product_support_files (archivos de apoyo compartidos por la familia)
projects → project_images
locations
site_settings
```

## Qué se puede administrar

| Módulo | Ruta | Operaciones |
| --- | --- | --- |
| Catálogo y acabados | `/admin/productos` | Vista por familia, acceso a colores, búsqueda, filtros, paginación, CRUD, SEO, precio, datos técnicos guiados, diagnóstico de calculadora y media |
| Categorías de uso | `/admin/categorias` | Interior / Exterior; editar, publicar y ordenar |
| Tipos de producto | `/admin/familias` | Producto del Excel: Lambrín, Piso SPC, Accesorios; CRUD y categoría de uso |
| Familias / subcategorías | `/admin/variantes` | Familia del Excel: Premium 4, Madera, etc.; CRUD, acceso a colores y PDF compartidos |
| Proyectos | `/admin/proyectos` | CRUD, contenido, materiales, reto/resultado, SEO, estados y galería |
| Ubicaciones | `/admin/ubicaciones` | CRUD, ciudad/sucursal, dirección, horarios, teléfono, WhatsApp, mapa y coordenadas |
| Configuración | `/admin/configuracion` | WhatsApp global, URL del catálogo del menú y visibilidad global de secciones |

Los listados adicionales tienen búsqueda por nombre, estado y páginas de 25 registros. El catálogo administrativo conserva páginas de 8 y abre por familias: `?vista=familias`. `?vista=acabados` muestra los colores; `?familia={uuid}` filtra los de una familia. Crear usa `/nuevo` (`/nueva` para ubicaciones); editar usa `/{uuid}`. Al añadir un color desde la familia, la relación se preselecciona. Las rutas históricas se conservan, pero sus etiquetas siguen la nomenclatura del Excel. Los selectores están dimensionados al catálogo actual (hasta 1000 opciones).

### Publicar un acabado

1. Crear o elegir una categoría publicada.
2. Crear o elegir un tipo de producto publicado dentro de ella.
3. Crear o elegir una familia/subcategoría publicada.
4. Crear el acabado, guardar y añadir imágenes.
5. Publicar el acabado y abrir su URL pública.

Un padre en borrador oculta sus descendientes, incluso en la API pública de Supabase. Despublicar o borrar una ficha hace que su URL responda 404. Los fallos de consulta se propagan como errores; no se convierten en catálogo ficticio ni en falsas fichas inexistentes.

Los slugs existentes se conservan salvo edición explícita confirmada. No hay redirecciones automáticas para slugs anteriores.

Las descripciones/resúmenes de familia y tipo se usan como respaldo cuando el acabado no tiene un valor propio. La ficha técnica y guía aceptan enlaces HTTP(S). Presentación, piezas, cobertura, peso y resistencias tienen campos guiados; las claves técnicas adicionales se conservan en un JSON avanzado. `faq_items` usa un objeto pregunta → respuesta. Las instrucciones de instalación se capturan como texto, un paso por línea.

### Inventario y calculadora

El inventario canónico vigente es el Excel: 160 combinaciones únicas según `canonical-inventory-migration-report.md`, no las 112 del inventario inicial. El sitio muestra una tarjeta por familia y conserva las URLs de sus colores. El nombre de un acabado debe ser solo su color; SKU es opcional.

El admin valida en servidor cobertura (`4.60 m²`), piezas (`10 piezas` o `N/A`) y dimensiones (`290 x 10 cm`). No impone rendimiento a accesorios ni inventa datos. Conserva valores heredados sin modificar, como `N/A piezas`. En vigas, el inventario tiene secciones transversales como `290 x 10*5 cm`: se conservan como texto y el largo sigue siendo 290 cm.

El diagnóstico muestra la configuración guardada usando `getProductCalculator`, la misma función del sitio: área, metros lineales o calculadora oculta. No agrega merma ni deriva cobertura geométrica. Los acabados nuevos reciben la imagen temporal compartida; el panel muestra cuándo falta una foto real. El precio $1.00 se identifica como valor temporal de la importación.

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

## Archivos de apoyo

Los archivos de apoyo se administran desde la familia en `/admin/variantes/{uuid}` o desde cualquiera de sus acabados en `/admin/productos/{uuid}`, en la sección **Material de apoyo**.

### Subir un archivo

1. Abre `/admin/productos` y selecciona un acabado de la familia correspondiente.
2. Entra a **Material de apoyo**.
3. Escribe el título que verá el visitante, por ejemplo `Ficha técnica`.
4. Selecciona un archivo PDF y, si hace falta, define su orden.
5. Pulsa **Subir archivo**.

Los archivos se asocian a la variante/familia del acabado, no a un color individual. Por lo tanto, un archivo subido desde cualquiera de los acabados de una familia aparece automáticamente en todos sus acabados publicados. Esto permite cargar una sola ficha técnica para todos los colores de una línea, como Lambrín Premium 4.

### Reglas y almacenamiento

- Solo se aceptan archivos PDF de hasta 15 MB.
- Con JavaScript, el navegador sube directamente a una URL firmada de Storage. Vercel solo recibe autorización y confirmación, no el archivo grande. Sin JavaScript se admite el formulario convencional hasta 4 MB.
- El servidor comprueba tamaño y cabecera PDF antes de marcar el archivo disponible. Una subida incompleta queda visible solo en admin como pendiente y puede retirarse para reintentar.
- El título es obligatorio y admite hasta 160 caracteres.
- Los archivos se guardan en `product_support_files` y en el bucket público `site-media`, bajo `support/{variant_id}/`.
- El visitante ve cada archivo como un botón de descarga dentro de **Material de apoyo**.
- Si no existe un archivo subido, `technical_sheet_url` continúa funcionando como enlace externo legado.
- Para quitar un archivo, marca **Confirmo eliminar** y pulsa **Eliminar**.
- El título y el orden se pueden editar. La galería pública de descargas respeta el orden guardado.
- La eliminación borra el registro de la base de datos y el objeto correspondiente de Storage.
- Las eliminaciones se limitan a la familia abierta. Un trigger registra los archivos a limpiar, incluidos los borrados en cascada; si Storage falla se conserva la tarea para reintentar.

`site-media` es público: no deben subirse documentos confidenciales. RLS limita la gestión de registros y las operaciones de subida/eliminación al administrador autenticado.

## Integración pública

Inicio, catálogo, búsqueda, fichas, proyectos, ubicaciones y contacto usan SSR. Contacto también necesita runtime para el menú y pie administrables. El inicio consulta categorías, productos, proyectos y ubicaciones reales. El pie ya usa enlaces de productos existentes. Las imágenes de proyectos se muestran en inicio, listado, ficha y galería; las de productos en la ficha y galería, respetando `alt_text`.

SEO title, description y canonical de acabados y SEO de proyectos se usan en los metadatos de sus fichas. Coordenadas de ubicaciones generan un enlace de mapa si no se capturó uno. Los campos SEO de categorías/familias/ubicaciones quedan guardados para futuras páginas individuales: hoy no existen rutas públicas individuales para esas entidades.

Los cambios publicados aparecen en la siguiente petición al sitio después de desplegar esta implementación. No hace falta rebuild por edición de contenido.

El cambio reciente de ubicaciones conserva dos sucursales locales de respaldo cuando Supabase no devuelve sucursales publicadas. El admin muestra este comportamiento explícitamente. Categorías y navegación pública están orientadas a Interior/Exterior; Accesorios es un tipo de producto, no una tercera pestaña de uso.

## Migración de cierre

`supabase/migrations/20260920150000_admin_completion.sql` agrega:

- `product_options.faq_items`.
- Cola y triggers de limpieza de media.
- RLS de publicación que respeta los ancestros del acabado.
- Valor inicial de `site_settings.catalog_url` sin sobrescribir uno existente.

Aplicada y verificada en el proyecto vinculado el 2026-09-20. Las tres migraciones anteriores ya estaban aplicadas. No se reejecutó el seed del inventario.

La adaptación del 2026-09-21 agrega `20260921150000_admin_support_uploads.sql`, aplicada al proyecto vinculado: estado pendiente/disponible para PDF y trigger de limpieza. No modifica el inventario comercial.

La limpieza automática procesa únicamente las rutas de la operación actual. La limpieza manual trabaja en lotes de 20. Las entradas antiguas que vuelven a tener referencias se retiran de la cola sin borrar el archivo; una eliminación posterior volverá a encolarlas. Esto evita que rutas reutilizadas durante la migración bloqueen nuevas eliminaciones.

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

La prueba también verifica vista por familias, campos guiados, diagnóstico de calculadora, subida directa de PDF de 5 MB, ocultamiento del PDF pendiente, publicación compartida entre dos colores, edición de título/orden y eliminación del archivo. Terminó correctamente después de corregir el bloqueo de la cola histórica de limpieza.

## Estado histórico del primer cierre (2026-09-20)

La revisión de esa fecha encontró **0 proyectos, 0 ubicaciones y 0 perfiles admin**. No es un conteo actualizado. Para operar con una cuenta definitiva, crear el usuario Auth y asignar su perfil admin según `SUPABASE_CMS.md`; después capturar proyectos y ubicaciones reales desde el panel. El comportamiento de respaldo de ubicaciones cambió posteriormente y está documentado arriba.

El usuario y los registros usados en la prueba end-to-end fueron retirados. El frontend requiere desplegar los cambios de este repositorio para que estas pantallas estén disponibles en Vercel.
