# Avance de implementacion Deco / referencia Saro Tech

Fecha: 2026-09-07

## Objetivo

Registrar los cambios aplicados para igualar progresivamente el sitio de Deco al sistema visual y comportamiento documentado en `DECO_PROJECT_REFERENCE_CONTEXT.md`, sin copiar contenido ni assets de Saro Tech.

## Regla global de documentacion

- Los archivos editables deben incluir comentarios breves para ubicar su estructura.
- En archivos `.astro`, cada seccion principal debe marcarse antes del bloque con el formato `<!-- Seccion: Nombre -->`.
- Esta regla aplica para el home actual y para las futuras paginas de productos, proyectos, ubicaciones y contacto.

## Fase 1: Home / index

Archivos modificados:

- `src/pages/index.astro`
- `src/styles/global.css`

Cambios aplicados:

- Se elimino `Deco Rewards` de la navegacion principal.
- Se agrego `Contacto` a la navegacion principal.
- La navegacion del header dejo de usar anchors internos y ahora apunta a rutas reales: `/`, `/productos`, `/proyectos`, `/ubicaciones`, `/contacto`.
- El CTA superior de calculo/material ahora apunta a `/contacto`.
- Se agrego la seccion `Los mas populares` antes de `Compra por categoria`.
- Las cards de productos populares ahora son links completos hacia futuras rutas `/productos/[slug]`.
- Las categorias ahora apuntan a futuras URLs con query de categoria: `/productos?categoria=<slug>`.
- Las ubicaciones del home ahora usan ciudad/sucursal como heading principal y estado/direccion como metadata.
- Los enlaces del footer fueron actualizados para apuntar a rutas reales.
- Los productos populares del footer se alimentan desde la misma lista usada en el home.
- Se ajusto la paleta base en `global.css` para acercarla a la referencia: negro sobrio, papel calido, verde principal y verde suave.
- Se agregaron comentarios de seccion en `src/pages/index.astro` para facilitar modificaciones directas.

### Mejora: Archivo de proyectos dinamico

Archivos modificados:

- `src/pages/index.astro`
- `src/styles/global.css`

Cambios aplicados:

- La seccion `Archivo de proyectos` dejo de usar contenido estatico para el proyecto destacado.
- Se agrego una estructura local `projectItems` con datos por proyecto: nombre, slug, tipo, ubicacion, texto alternativo, identificador visual y chips/materiales.
- El render inicial toma el primer proyecto disponible mediante `initialProject`.
- El indice numerado ahora usa botones accesibles en lugar de enlaces estaticos, con `aria-pressed` para comunicar el estado activo.
- Al hacer click en un proyecto del indice se actualizan dinamicamente el resaltado, visual destacado, tipo, nombre, ubicacion, chips y enlace del card.
- Se agrego la cabecera visual del archivo con contador dinamico y controles de flecha anterior/siguiente.
- El contador muestra el proyecto activo con formato de dos digitos, por ejemplo `01 / 03`.
- Las flechas anterior/siguiente usan el mismo flujo de estado que el indice y navegan en ciclo: desde el ultimo proyecto vuelven al primero y desde el primero vuelven al ultimo.
- Se agrego el bloque `<!-- Seccion: Interacciones de proyectos -->` en `index.astro` para concentrar el JavaScript minimo necesario de la seccion.
- Se ajusto el estilo visual para acercarse al mockup recibido: cabecera con linea divisoria, contador a la derecha, botones cuadrados con borde, indice con numeros grandes y separacion superior antes de la imagen destacada.
- Se agregaron estilos responsive para que la cabecera, controles, indice y proyecto destacado funcionen en tablet y mobile.

Notas tecnicas:

- Actualmente no existen imagenes reales de proyectos dentro de `public/`, por lo que los visuales destacados se representan con composiciones CSS temporales por proyecto.
- La estructura de datos ya deja listo el reemplazo futuro por imagenes reales provenientes de assets locales o WordPress Media Library.
- El JavaScript no introduce dependencias externas y solo manipula atributos/textos de la seccion para mantener el build estatico y ligero.

Validaciones ejecutadas:

- `npm run build`
- `npx tsc --noEmit`

## Pendiente de esta fase

- Crear las paginas reales enlazadas desde el home: `/productos`, `/productos/[slug]`, `/proyectos`, `/ubicaciones`, `/contacto`.
- Mover productos, categorias, proyectos y ubicaciones a `src/data` cuando se inicie la fase de catalogo.
- Sustituir placeholders CSS de productos por assets propios aprobados por Deco.
- Validar textos, telefono, correo y datos reales de Deco.

## Notas

- Algunos links ya apuntan a rutas futuras que todavia no existen. Esto se hizo a proposito para dejar el flujo de navegacion alineado al alcance final antes de construir las paginas siguientes.
- No se usaron assets ni nombres de inventario real de Saro Tech.

## Fase 2: Catalogo de productos

Archivos modificados:

- `src/types/products.ts`
- `src/data/products.ts`
- `src/services/productService.ts`
- `src/components/products/ProductMegaMenu.astro`
- `src/components/products/ProductFilters.astro`
- `src/components/products/ProductGrid.astro`
- `src/components/products/ProductCard.astro`
- `src/components/products/ProductPagination.astro`
- `src/pages/productos.astro`
- `src/pages/productos/[slug].astro`

Cambios aplicados:

- Se creo la base local tipada para productos, categorias, variantes y colores.
- Se agrego fallback local con placeholders derivados del inventario actual de Deco.
- Se implemento `/productos` con filtros por `Todo`, `Interior` y `Exterior`; se removio `Accesorios` porque no existe como macro categoria de Deco.
- Se agrego boton `Limpiar filtros` para resetear macro categoria, categorias, colores, busqueda, orden y paginacion.
- Se activo el selector `Ordenar por` con orden por destacados y nombre, preservando el estado en `?orden=<valor>`.
- Se suavizo la apertura de los submenus Interior/Exterior con una transicion de 500ms.
- Se implemento `/productos/[slug]` con rutas estaticas, detalle basico, CTA y relacionados.

Validaciones ejecutadas:

- `npm run build`
- `npx tsc --noEmit`
