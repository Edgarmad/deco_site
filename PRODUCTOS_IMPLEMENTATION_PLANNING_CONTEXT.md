# Contexto de planeacion: Productos Deco

Fecha de creacion: 2026-09-08

## Objetivo

Planear la implementacion de la pagina `/productos` de Deco antes de escribir codigo de la fase de catalogo.

La pagina debe tomar como referencia visual y de comportamiento el catalogo actual de Saro Tech, los mockups locales en `mockup/productos/` y el inventario actual de Deco en `inventario.json`. La fuente final de contenido sera WordPress headless, pero mientras el CMS no exista se usaran datos locales vacios o dummies controlados para validar la UI.

Este documento debe usarse como contexto principal antes de implementar productos.

## Fuentes revisadas

Documentos raiz revisados o considerados:

- `DECO_PROJECT_CONTEXT.md`
- `DECO_PROJECT_REFERENCE_CONTEXT.md`
- `DECO_PROJECT_IMPLEMENTATION_PROGRESS.md`
- `productos-mila-web-migration-context.md`
- `wordpress-headless.md`
- `WP_MEDIA_LIBRARY_MIGRATION_CONTEXT.md`
- `PLUGIN_CHANGE_CONTEXT.md`
- `HOSTGATOR_DEPLOY_CONTEXT.md`
- `HOSTGATOR_FTP_CONTEXT.md`
- `HOSTGATOR_NUEVO_PROYECTO_LECCIONES.md`
- `README.md`

Mockups revisados:

- `mockup/productos/productos.png`
- `mockup/productos/productos_submenu1_desplegado.png`
- `mockup/productos/productos_submenu2_desplegado.png`

Crawl revisado:

- `https://sarotech.io/productos`

Inventario revisado:

- `inventario.json`

## Decisiones base

- El frontend publico seguira siendo Astro estatico.
- WordPress sera la fuente final de productos, categorias, variantes, colores e imagenes.
- Los componentes visuales no deben conocer detalles internos de WordPress.
- La capa `src/services` normalizara datos del CMS a tipos propios de Deco.
- Mientras WordPress no exista, el build debe funcionar con fallback local.
- No se deben copiar productos, assets ni datos reales de Saro Tech; solo se replica estructura, ritmo visual y comportamiento.
- Los links principales ya deben usar rutas reales: `/productos`, `/proyectos`, `/ubicaciones`, `/contacto`.
- En archivos `.astro`, cada bloque principal debe llevar comentario `<!-- Seccion: Nombre -->`.

## Buenas practicas de programacion

Este punto es importante y debe tratarse como requisito transversal durante toda la implementacion de productos.

- Mantener cambios pequenos, claros y faciles de revisar.
- Separar responsabilidades: paginas para composicion, componentes para UI, servicios para datos y tipos para contratos.
- No mezclar detalles de WordPress, REST API, `_embedded`, IDs de attachments o post meta dentro de componentes visuales.
- Normalizar datos externos antes de renderizarlos.
- Usar TypeScript con tipos explicitos para productos, categorias, variantes, colores y respuestas normalizadas.
- Evitar `any` salvo que exista una razon concreta y documentada.
- Evitar duplicacion; extraer componentes o helpers solo cuando exista reutilizacion real.
- Preferir soluciones simples antes que abstracciones prematuras.
- Manejar estados vacios, sin resultados, errores de WordPress y fallbacks de forma explicita.
- No hardcodear credenciales, dominios finales, tokens, rutas FTP ni datos sensibles.
- Mantener URLs, slugs y nombres de campos consistentes y estables.
- Cuidar accesibilidad: HTML semantico, labels, botones reales, `aria-expanded`, `aria-current`, estados `disabled` y navegacion por teclado.
- Cuidar performance: sitio estatico, JavaScript minimo, imagenes optimizadas y sin dependencias pesadas innecesarias.
- Cuidar SEO: titulos, descripcion, headings ordenados, URLs claras y contenido indexable.
- Agregar comentarios solo para ubicar secciones o explicar decisiones no obvias; no comentar lo evidente.
- No introducir compatibilidad legacy o backward compatibility si no hay una necesidad concreta.
- Probar cambios relevantes con `npm run build` y, cuando aplique, `npx tsc --noEmit`.

## Estado actual del repo

- Actualmente solo existe `src/pages/index.astro` como pagina principal.
- `src/styles/global.css` contiene la paleta cercana a Saro Tech: `--black`, `--black-soft`, `--white`, `--white-pure`, `--green`, `--green-soft`.
- El home ya enlaza a `/productos` y a rutas futuras `/productos/[slug]`.
- Faltan las paginas reales del catalogo y detalle.
- Faltan `src/data`, `src/services`, `src/types`, layouts o componentes compartidos para productos.
- El README aun conserva referencias antiguas de Mila/Revelo y rutas `/products`; para Deco la ruta objetivo debe ser `/productos`.

## Observaciones del mockup de productos

Vista completa `productos.png`:

- Header oscuro sticky/superior con logo a la izquierda, navegacion en mayusculas y `PRODUCTOS` activo con subrayado verde.
- Franja negra secundaria bajo el header con dos grupos: `PRODUCTOS DE INTERIOR` y `PRODUCTOS DE EXTERIOR`.
- Catalogo sobre fondo blanco.
- Tabs superiores: `Todo`, `Interior`, `Exterior`, `Accesorios`.
- Sidebar izquierda con filtros.
- Grid desktop de 4 columnas.
- Producto con imagen centrada, nombre multilinea, `SKU`, y color/acabado debajo.
- Paginacion centrada con texto `Mostrando 1-12 de ... productos`.
- Footer oscuro ya alineado al sistema visual documentado.

Vista `productos_submenu1_desplegado.png`:

- Al pasar sobre `PRODUCTOS DE INTERIOR`, aparece un mega submenu oscuro con familias de producto en varias lineas.
- El item activo/hover se ve como chip gris oscuro redondeado.
- El submenu ocupa altura dentro de la zona negra y empuja visualmente el catalogo hacia abajo.

Vista `productos_submenu2_desplegado.png`:

- Al pasar sobre `PRODUCTOS DE EXTERIOR`, aparece un mega submenu similar con familias exteriores.
- El comportamiento debe ser simetrico al submenu de interiores.

## Observaciones del crawl de Saro Tech

Estructura visible o inferida:

- Header con clases de referencia: `header`, `header-container`, `hamburger-menu`, `logo-section`, `desktop-nav`, `action-buttons`, `mobile-menu-overlay`, `mobile-nav`.
- El catalogo renderizado por Next aparece inicialmente con loading `Cargando catalogo...`, pero los mockups muestran el estado hidratado.
- Footer oscuro con slogan grande y palabras en serif/italica verde.

Patrones UI relevantes:

- Filtro rapido por macro categoria: `Todo`, `Interior`, `Exterior`, `Accesorios`.
- Sidebar con `Tipo de producto`, `Colores` y `Buscar`.
- Boton `Ocultar filtros` para alternar el sidebar.
- Selectores visuales `Ordenar por` y `Productos por pagina: 12`.
- Paginacion con pagina activa negra, anterior deshabilitado y siguiente activo.
- Mobile requiere header hamburguesa, menu/acordeon, busqueda compacta y filtros tipo drawer o bloque colapsado.

Accesibilidad a preservar:

- `lang="es"`.
- Botones reales para abrir/cerrar menus.
- `aria-expanded` en submenus y menu mobile.
- `aria-current` para estado activo.
- Labels para checkboxes e input de busqueda.
- Estados disabled reales en paginacion.

## Inventario actual de Deco

Estructura detectada en `inventario.json`:

```text
categories[]
  category: Interior | Exterior
  products[]
    product
    variants[]
      variant
      status: empty | partial | complete
      colors[]
        color
        status
        images
          imagen_principal[]
          imagen_secundaria[]
          extras[]
```

Contenido actual detectado:

- Categoria `Exterior`:
  - `Lambrin Exterior`
  - `Deck`
- Categoria `Interior`:
  - `Panel Lambrin WPC`
    - `Lambrin Premium WPC`
    - `Lambrin Irregular`
    - `Lambrin Wavy Max`
      - `Roble Dorado` vacio
      - `Gold Rio` parcial con nota de posible archivo mal asignado
      - `Brasilia` completo con imagen principal, secundaria y extra

Implicaciones:

- El inventario no esta listo como catalogo final; varias carpetas estan vacias.
- Debe usarse como fuente temporal de estructura, no como verdad final de producto publicado.
- Los estados `empty`, `partial` y notas deben mantenerse visibles para migracion/auditoria, pero no necesariamente mostrarse al usuario final.
- Para UI se pueden crear 3 a 6 dummies derivados de esta estructura, marcados claramente como temporales.

## Modelo local recomendado

Crear tipos propios de Deco antes de conectar WordPress:

```ts
export type ProductMacroCategory = 'interior' | 'exterior' | 'accesorios';

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  macroCategory: ProductMacroCategory;
  description?: string;
  count?: number;
};

export type ProductColor = {
  name: string;
  slug: string;
  sku?: string;
  image?: string;
  gallery?: string[];
  status?: 'empty' | 'partial' | 'complete';
};

export type ProductVariant = {
  name: string;
  slug: string;
  colors: ProductColor[];
};

export type Product = {
  name: string;
  slug: string;
  categorySlug: string;
  macroCategory: ProductMacroCategory;
  summary?: string;
  sku?: string;
  image?: string;
  gallery?: string[];
  variants: ProductVariant[];
  featured?: boolean;
  status?: 'draft' | 'published' | 'placeholder';
};
```

Reglas del fallback local:

- Si no hay WordPress, renderizar catalogo con lista vacia o dummies temporales.
- Los dummies deben vivir en `src/data/products.ts` o `src/data/productPlaceholders.ts`.
- Cada dummy debe tener `status: 'placeholder'`.
- No mezclar URLs de Google Drive como imagen publica final; si se usan para referencia, documentarlas como origen de migracion.
- Cuando haya assets reales descargados/optimizados, moverlos a `public/assets/products/` solo como fallback transicional.

## Modelo WordPress futuro

Mantener el patron validado en Mila, pero con prefijos Deco:

```text
products custom post type
product_category taxonomy
_deco_price opcional
_deco_compare_at_price opcional
_deco_sku
_deco_available opcional
_deco_featured
_deco_display_order
_deco_collection opcional
_deco_brand opcional
_deco_dimensions opcional
_deco_keywords opcional
_deco_main_image
_deco_gallery_images
_deco_colors
_deco_variants
_deco_specifications
```

REST fields recomendados:

```text
products.product_details
products.main_image_url
products.gallery_urls
product_category.category_details
product_category.category_image_url
```

Endpoints esperados:

```text
GET /wp-json/wp/v2/products?_embed
GET /wp-json/wp/v2/products?slug={slug}&_embed
GET /wp-json/wp/v2/product_category?hide_empty=false
```

Reglas de migracion a WP:

- Guardar imagenes como attachment IDs en Media Library.
- Exponer URLs calculadas por REST.
- Importar desde inventario de forma idempotente.
- No borrar ni reasignar media/productos sin confirmacion.
- Auditar primero `empty`, `partial`, `complete` antes de crear contenido final.
- No reutilizar prefijos `milapro` en nuevo plugin de Deco.

## Arquitectura de frontend propuesta

Archivos sugeridos para la fase de implementacion:

```text
src/types/products.ts
src/data/products.ts
src/services/productService.ts
src/components/products/ProductMegaMenu.astro
src/components/products/ProductFilters.astro
src/components/products/ProductGrid.astro
src/components/products/ProductCard.astro
src/components/products/ProductPagination.astro
src/pages/productos.astro
src/pages/productos/[slug].astro
```

Implementacion minima preferida:

- Mantener header/footer en la pagina al inicio si aun no hay layout compartido.
- Extraer componentes solo cuando evite duplicacion real o mejore claridad.
- Empezar con `/productos.astro` y dummies locales antes del detalle.
- Crear `/productos/[slug].astro` cuando ya exista `Product` normalizado y slugs estables.

## Comportamiento de `/productos`

Entrada de datos:

- `getProducts()` desde `src/services/productService.ts`.
- `getProductCategories()` desde el mismo servicio.
- Si `WORDPRESS_API_URL` existe y responde, usar WP.
- Si WP no esta configurado o falla, usar fallback local.

Filtros iniciales:

- Query `categoria=<slug>` para macro categoria o categoria concreta.
- Query `q=<texto>` para busqueda por nombre, SKU, variante o color.
- Query `page=<n>` para paginacion.
- `perPage=12` por defecto.

Interactividad inicial recomendada:

- En build estatico, procesar query en cliente con JavaScript minimo o renderizar estado inicial sin depender de servidor.
- Para primera version, se puede implementar filtrado client-side ligero sobre datos embebidos si la lista es pequena.
- Cuando el catalogo crezca, preferir paginas estaticas por categoria o build con rutas generadas.

Layout desktop:

- Header oscuro.
- Franja de mega menu interior/exterior.
- Tabs de categoria.
- Controles superiores a la derecha.
- Sidebar de filtros de ancho fijo.
- Grid de 4 columnas.
- Paginacion centrada.
- Footer oscuro.

Layout mobile:

- Header mobile con boton hamburguesa.
- `PRODUCTOS DE INTERIOR` y `PRODUCTOS DE EXTERIOR` como acordeones.
- Filtros colapsados o drawer.
- Grid de 1 columna o 2 columnas si las imagenes lo soportan.
- Paginacion compacta.

## Comportamiento del mega menu

Requisitos:

- Dos triggers: `PRODUCTOS DE INTERIOR` y `PRODUCTOS DE EXTERIOR`.
- En desktop, abrir submenu al hover y al focus.
- En mobile, abrir/cerrar con click como acordeon.
- Cada familia debe ser link a `/productos?categoria=<slug>`.
- Item activo debe verse como chip gris oscuro redondeado.
- `aria-expanded` debe actualizarse.
- El submenu debe permanecer navegable con teclado.

Categorias iniciales sugeridas desde inventario:

- Interior:
  - `Panel Lambrin WPC`
  - `Lambrin Premium WPC`
  - `Lambrin Irregular`
  - `Lambrin Wavy Max`
- Exterior:
  - `Lambrin Exterior`
  - `Deck`

Categorias de Saro solo deben servir como referencia visual para cantidad, espaciado y comportamiento.

## Detalle `/productos/[slug]`

Primera version recomendada:

- Imagen principal o placeholder de material.
- Nombre grande.
- Categoria y macro categoria.
- SKU si existe.
- Descripcion breve.
- Variantes y colores como chips/lista.
- Galeria si existe.
- CTA a `/contacto` para cotizacion.
- Productos relacionados por categoria.
- Link claro de regreso a `/productos`.

No implementar carrito, checkout ni inventario comercial avanzado en esta fase.

## Estilos a preservar

- Fondo oscuro de header/footer: `--black` y `--black-soft`.
- Fondo catalogo: blanco puro o papel claro segun contraste.
- Verde marca: `--green` para activo/subrayado/acento.
- Gris oscuro para chips activos de submenu.
- Texto de producto en azul grisaceo oscuro o `--black` suavizado.
- Texto secundario en `--muted`.
- Tipografia sans grotesca como base y serif en elementos editoriales/footer.
- Mucho espacio horizontal en desktop y grid limpio.

## Estados necesarios

- Catalogo con datos.
- Catalogo vacio por falta de WordPress/contenido.
- Sin resultados por busqueda/filtro.
- Filtros ocultos.
- Pagina sin productos suficientes para paginacion.
- Producto no encontrado en `/productos/[slug]`.

## Plan de implementacion sugerido

Fase 1: base de datos local y servicio

- Crear tipos de producto.
- Crear datos locales temporales desde `inventario.json` con 3 a 6 placeholders.
- Crear servicio que primero intente WordPress y luego fallback local.
- Normalizar slugs, categorias, variantes y colores.

Fase 2: pagina `/productos`

- Crear estructura visual completa segun mockup.
- Agregar mega menu interior/exterior.
- Agregar filtros, busqueda visual, grid y paginacion.
- Manejar estado vacio y sin resultados.

Fase 3: detalle de producto

- Generar rutas estaticas con `getStaticPaths`.
- Renderizar producto normalizado.
- Agregar relacionados y CTA de contacto.

Fase 4: preparacion WordPress

- Definir plugin Deco o adaptar patron del plugin anterior con prefijos nuevos.
- Registrar CPT, taxonomia, metaboxes y REST fields.
- Crear migrador idempotente desde inventario.
- Validar Media Library como fuente final de imagenes.

Fase 5: refinamiento visual y responsive

- Ajustar mobile en 360, 390, 414, 768, 980 y 1024 px.
- Validar accesibilidad de menus, filtros y paginacion.
- Sustituir dummies por imagenes reales o WP cuando esten listas.

## Validaciones esperadas

Despues de implementar codigo:

```bash
npm run build
npx tsc --noEmit
```

Cuando exista WordPress:

```text
/wp-json/wp/v2/products?_embed
/wp-json/wp/v2/products?slug={slug}&_embed
/wp-json/wp/v2/product_category?hide_empty=false
```

## Pendientes de definicion

- Nombre final visible de la marca en el logo y header.
- Telefono, WhatsApp y correo reales de Deco.
- Si `Accesorios` sera macro categoria real o solo filtro visual.
- Si los productos se publicaran como producto base, variante o color individual.
- Slugs finales para categorias y productos.
- Imagenes reales descargadas/optimizadas desde Drive o cargadas directo en WordPress.
- Campos comerciales finales: precio, medidas, disponibilidad, ficha tecnica, usos, mantenimiento.
- Nombre definitivo del plugin WordPress de Deco.

## Criterio de exito de esta fase

- `/productos` debe verse y comportarse como el mockup recibido.
- El mega menu debe abrir Interior/Exterior como en `productos_submenu1_desplegado.png` y `productos_submenu2_desplegado.png`.
- El catalogo debe soportar contenido vacio sin romper el build.
- Los dummies temporales deben estar claramente separados del modelo final.
- La arquitectura debe quedar lista para reemplazar fallback local por WordPress sin reescribir componentes visuales.
