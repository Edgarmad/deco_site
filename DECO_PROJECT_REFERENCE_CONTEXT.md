# Contexto de referencia visual Saro Tech

Fecha de investigacion: 2026-09-07
Sitio revisado: https://sarotech.io/

## Objetivo

Usar este documento como referencia para igualar lo mas posible el nuevo sitio de Deco al sitio actual de Saro Tech, sin depender de memoria ni suposiciones. El foco es replicar el diseno, la navegacion, la experiencia responsive y especialmente el comportamiento de navegacion entre productos. No se debe copiar el contenido, la lista real de productos/proyectos/ubicaciones ni los assets publicos, porque Deco usara contenido y recursos propios.

## Regla global de documentacion

- Los archivos editables deben quedar documentados con comentarios breves que indiquen la estructura.
- En archivos `.astro`, cada seccion principal debe incluir un comentario antes del bloque correspondiente con el formato `<!-- Seccion: Nombre -->`.
- Los comentarios deben ayudar a ubicar rapidamente header, hero, productos populares, categorias, ubicaciones, proyectos, footer y cualquier bloque nuevo.
- Evitar comentarios que repitan cada linea de codigo; el objetivo es facilitar modificaciones directas y mantener orden visual del archivo.

## Alcance del crawl

Paginas revisadas:

- `https://sarotech.io/`
- `https://sarotech.io/productos`
- `https://sarotech.io/proyectos`
- `https://sarotech.io/ubicaciones`
- `https://sarotech.io/contacto`

El sitio esta construido con Next.js y carga CSS estatico desde `/_next/static/chunks/`. El crawl de assets se uso solo para entender patrones visuales, no como inventario a reutilizar.

## Alcance final para Deco

Paginas que si se crearan:

- `/`
- `/productos`
- `/productos/[slug]`
- `/proyectos`
- `/proyectos/[slug]` si se requiere detalle visual similar al original.
- `/ubicaciones`
- `/contacto`

Paginas fuera de alcance:

- `/saro-rewards`
- `/deco-rewards`

Contenido fuera de alcance de este contexto:

- Lista exacta de productos de Saro Tech.
- Lista exacta de proyectos de Saro Tech.
- Lista exacta de ubicaciones de Saro Tech.
- Assets publicos del dominio `assets.sarotech.io`.

El objetivo es replicar sistema visual, jerarquia, layout, navegacion y comportamiento, no clonar contenido.

## Tipografias detectadas

El CSS de Saro Tech define dos familias custom:

- Sans principal: `fontSans`, archivo `PasticheGrotesque-s.p.0d1v4y5rk43ch.ttf`.
- Serif de apoyo: `fontSerif`, archivo `IBMPlexSerif_Medium-s.13r.t_2onw9jm.ttf`, peso `500`.

Declaraciones encontradas:

```css
@font-face {
  font-family: fontSans;
  src: url(../media/PasticheGrotesque-s.p.0d1v4y5rk43ch.ttf) format("truetype");
  font-display: swap;
}

@font-face {
  font-family: fontSerif;
  src: url(../media/IBMPlexSerif_Medium-s.13r.t_2onw9jm.ttf) format("truetype");
  font-display: swap;
  font-weight: 500;
}
```

Variables equivalentes detectadas:

```css
--font-sans: var(--font-pastiche), Arial, sans-serif;
--font-serif: var(--font-plex-serif), Georgia, serif;
--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
```

Recomendacion para Deco:

- Si el cliente tiene licencia o autorizacion para las fuentes, agregarlas a `public/assets/fonts/` y declararlas en `src/styles/global.css`.
- Si no hay licencia de Pastiche Grotesque, buscar una alternativa grotesca condensada/geometrica y ajustar tracking, pesos y tamanos para conservar el caracter visual.
- Mantener `Georgia` o una serif similar como fallback mientras se valida `IBM Plex Serif Medium`.

## Paleta detectada

Colores con mayor presencia en CSS:

- Blanco principal: `#fff`.
- Negro/base oscura: `#000`, `#0a0a0a`, `#141512`, `#171717`, `#252525`, `#2a2a2a`, `#333`.
- Verde marca principal: `#3d8555`.
- Verde acento claro: `#6fc08c`.
- Fondo claro calido: `#f6f5f1`.
- Grises/neutros: `#ccc`, `#999`, `#666`, `#a3a3a3`.
- Acentos Tailwind presentes pero secundarios: `#4ade80`, `#00bb7f`, `#ff2357`, `#fcbb00`.

Variables sugeridas para adaptar el sistema actual:

```css
:root {
  --saro-black: #141512;
  --saro-black-deep: #0a0a0a;
  --saro-white: #fff;
  --saro-paper: #f6f5f1;
  --saro-green: #3d8555;
  --saro-green-soft: #6fc08c;
  --saro-muted: #999;
  --saro-line-light: #ffffff1a;
  --saro-line-dark: #0000001a;
}
```

Comparacion con `src/styles/global.css` actual:

- Actual usa `--green: #3aa061`; Saro se ve mas sobrio con `#3d8555`.
- Actual usa `--green-soft: #86c59b`; Saro usa un verde claro menos pastel: `#6fc08c`.
- Actual usa `--white: #f7f7f2`; Saro usa tanto `#fff` como `#f6f5f1`. Conviene preservar el papel calido para bloques grandes y blanco puro para contraste.
- Actual define `--wood` y `--wood-dark`; en Saro no son colores de sistema dominantes, aparecen mas como contenido visual de productos/texturas que como UI.

## Breakpoints y responsividad

Breakpoints detectados:

- `@media (min-width: 40rem)`
- `@media (min-width: 48rem)`
- `@media (min-width: 64rem)`
- `@media (min-width: 80rem)`
- `@media (min-width: 96rem)`
- `@media (max-width: 768px)`
- `@media (max-width: 980px)`
- `@media (max-width: 1024px)`
- Ajustes finos mobile: `max-width: 360px`, `361px-390px`, `391px-768px`.

Recomendacion:

- Mantener el enfoque responsive actual, pero probar especificamente anchos `360`, `390`, `414`, `768`, `980`, `1024` y desktop ancho.
- El sitio original tiene ajustes finos para mobile chico; no asumir que un unico breakpoint basta.

## Estructura de navegacion

Navegacion principal detectada:

- `INICIO`
- `PRODUCTOS`
- `PROYECTOS`
- `UBICACIONES`
- `CONTACTO`

Footer/enlaces detectados:

- Ubicaciones
- Catalogo
- Contacto
- Telefono: `(81) 2351 2953`
- Email: `atencion@sarotech.io`
- Terminos y condiciones
- Ayuda y soporte
- Redes: `[ fb ]`, `[ in ]`, `[ ln ]`, `[ tk ]`, `[ pin ]`

Comparacion con repo actual:

- `src/pages/index.astro` todavia incluye `Deco Rewards`; debe eliminarse del nav y del alcance.
- Actualmente todo navega a anchors internos. Para igualar mejor el comportamiento del sitio original, la navegacion principal debe usar rutas reales: `/`, `/productos`, `/proyectos`, `/ubicaciones`, `/contacto`.
- Mantener el estilo de navegacion superior: header oscuro, textos en mayusculas, espaciado amplio, acciones rapidas a la derecha y separadores visuales cuando aplique.
- El footer puede conservar enlaces de soporte/redes, pero el contenido debe ajustarse a Deco.

## Home

SEO detectado:

- Title: `Saro Tech | Revestimientos Premium, Lambrines y Decks en Mexico`
- Description: `Distribucion y venta de revestimientos arquitectonicos premium: lambrines WPC/PVC, marmol sintetico, decks exteriores y piedra tecnologica PU. Alta gama para tus proyectos.`
- H1: `Revestimientos Premium y Paneles Decorativos (Lambrin, Marmol y Piedra Sintetica, Decks) en Mexico - Saro Tech`

Secciones detectadas:

- Hero con video de ancho completo.
- Bloque `Los mas populares`.
- Cards de productos populares con textura.
- Bloque `Compra por categoria`.
- Seccion de proyecto destacado.

Patron de productos populares:

- Cards visuales con textura o imagen de material.
- Titulo corto por producto.
- Navegacion directa al detalle del producto.
- Ritmo horizontal/reticula con alto impacto visual.

Patron de categorias:

- Filas o cards grandes por categoria.
- Numero, nombre, contador/resumen y CTA.
- El contenido exacto de categorias debe venir de Deco.

Comparacion con repo actual:

- El repo actual ya tiene hero, categorias, ubicaciones y proyectos, pero falta la seccion explicita `Los mas populares` antes de `Compra por categoria`.
- El repo actual usa formas CSS simuladas para productos; para igualar, reemplazar progresivamente placeholders por assets propios de Deco con proporcion y tratamiento visual similar.
- El repo actual tiene categorias hardcodeadas; conviene moverlas a datos para que el diseno soporte cualquier taxonomia real de Deco.

## Productos y catalogo

Esta es la parte mas importante a replicar. El contenido sera propio de Deco, pero el comportamiento debe sentirse como el original.

UI base detectada en catalogo:

- Boton/filtro `Filtrar por`.
- Filtros por categoria/tipo con contador visual.
- Buscador: `Buscar productos` y boton `Buscar`.
- Cards de producto en grilla, con imagen dominante, nombre corto y acceso al detalle.
- Navegacion desde home hacia catalogo por categoria, productos populares y enlaces del header/footer.

Flujo de navegacion que debe replicarse:

- Header `PRODUCTOS` lleva a `/productos`.
- Home `Los mas populares` debe mostrar cards clicables que llevan a `/productos/[slug]`.
- Home `Compra por categoria` debe llevar a `/productos?categoria=<slug>` o a `/productos#<categoria>` si se decide evitar query params.
- Catalogo `/productos` debe permitir filtrar por categoria sin perder la estructura visual de grilla.
- Busqueda en `/productos` debe filtrar localmente por nombre/categoria mientras no exista backend.
- Card de producto debe ser clicable completa, no solo el texto o boton.
- Detalle `/productos/[slug]` debe conservar header/footer global y ofrecer regreso claro a `/productos`.
- Desde detalle de producto deben existir productos relacionados o una navegacion visual de categoria para evitar callejon sin salida.

Comportamiento recomendado para Astro estatico:

- Usar `src/data/products.ts` como fuente inicial local.
- Generar rutas estaticas con `getStaticPaths` para `/productos/[slug]`.
- Para filtros, comenzar con query params simples y JavaScript minimo en cliente si se necesita interactividad.
- Si no hay JavaScript, renderizar enlaces por categoria como `/productos/categoria/[slug]` o query params procesados durante build solo si se generan paginas por categoria.
- Mantener URLs limpias, slugs estables y nombres desacoplados del contenido actual de Saro.

Layout recomendado del catalogo:

- Fondo claro calido `#f6f5f1` o blanco segun contraste.
- Header/hero de pagina con titulo grande en grotesca, texto auxiliar corto y espacio respirado.
- Barra de filtros superior o lateral segun ancho.
- En desktop: grilla amplia de 3 o 4 columnas, cards con imagen grande y alto consistente.
- En tablet: 2 columnas.
- En mobile: 1 columna, filtros colapsados o scroll horizontal de chips.
- Estados necesarios: sin resultados, busqueda activa, categoria activa, cargando solo si luego hay datos remotos.

Detalle de producto recomendado:

- Galeria o imagen hero del producto arriba.
- Nombre grande, categoria/tipo como metadata y descripcion breve.
- Especificaciones en bloques o tabla simple.
- CTA visible para contacto/cotizacion.
- Seccion de relacionados con la misma estetica de cards del catalogo.
- Mantener jerarquia visual sobria: negro, papel, verde marca y lineas delgadas.

Recomendacion:

- Documentar y construir primero el modelo de navegacion de productos antes de cargar contenido final.
- No copiar nombres, imagenes o categorias exactas de Saro si Deco usara otra oferta.
- Replicar proporcion, ritmo, tipografia, contraste, filtros y transiciones visuales.

## Proyectos

Patron visual a replicar:

- Archivo/listado de proyectos con indice numerado.
- Proyecto destacado con imagen grande o composicion visual dominante.
- Cards o paneles oscuros con metadata breve.
- Uso de chips para materiales/categorias instaladas.
- Detalle opcional con secciones tipo `Nombre del Proyecto`, materiales instalados y secciones de obra, pero usando contenido propio.

Comparacion con repo actual:

- La UI actual del repo tiene un proyecto destacado con chips; esto coincide con la intencion del original.
- No importa replicar la lista real de proyectos; importa mantener archivo numerado, contraste oscuro, imagen destacada y CTA hacia detalle o contacto.

## Ubicaciones

Patron visual a replicar:

- Pagina/listado con heading grande y filas por ubicacion.
- Cada fila debe tener numero, ciudad/sucursal como titulo, tipo de punto o metadata, direccion y accion visual.
- Estilo editorial: lineas divisorias delgadas, mucho espacio vertical, tipografia grande en mayusculas o grotesca fuerte.
- En mobile, las filas deben apilarse sin perder numero y CTA.

Comparacion con repo actual:

- El repo actual nombra estados como titulo. Para igualar el patron del original, usar ciudad/sucursal como heading principal y estado/direccion como metadata.
- No importa replicar ubicaciones exactas; usar las ubicaciones reales de Deco cuando existan.

## Contacto

Headings detectados:

- `Contacto`
- `Toda idea merece los materiales correctos. Cuentanos sobre tu proyecto y te ayudamos a hacerlo posible.`

Recomendacion:

- Crear pagina `/contacto` con layout oscuro, logo/isotipo, formulario y copy aspiracional similar.
- Evitar implementar envio real hasta que exista backend o endpoint definido.

## Brechas principales contra la implementacion actual

Prioridad alta:

- Reemplazar `Inter` por las fuentes reales o alternativas cercanas.
- Ajustar paleta a `#141512`, `#3d8555`, `#6fc08c`, `#f6f5f1`.
- Agregar bloque `Los mas populares` con tarjetas de textura antes de categorias.
- Convertir categorias y productos a datos locales para poder navegar entre home, catalogo y detalle.
- Usar ciudad/sucursal como heading principal en ubicaciones.
- Crear rutas reales: `/productos`, `/productos/[slug]`, `/proyectos`, `/ubicaciones`, `/contacto`.
- Eliminar `Deco Rewards` de navegacion y alcance.

Prioridad media:

- Sustituir formas CSS de producto por imagenes optimizadas o placeholders realistas.
- Agregar buscador y filtros visuales en catalogo.
- Documentar modelo de datos para productos/proyectos/ubicaciones antes de WordPress.
- Crear navegacion de productos relacionados desde el detalle.

Prioridad baja:

- Ajustar copy SEO final a la marca Deco.
- Agregar metadatos Open Graph e imagen social.
- Replicar microinteracciones solo despues de cerrar estructura y contenido.

## Siguiente implementacion sugerida

1. Declarar variables visuales y fuentes en `global.css`.
2. Crear `src/data` para productos, categorias, proyectos y ubicaciones con contenido propio de Deco.
3. Refactorizar el home para que consuma esos datos y agregue `Los mas populares`.
4. Crear paginas estaticas basicas para catalogo, detalle de producto, proyectos, ubicaciones y contacto.
5. Reemplazar placeholders por assets aprobados por el cliente.
