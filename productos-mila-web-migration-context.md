# Contexto de migracion: PRODUCTOS MILA WEB

Fecha de analisis inicial: 2026-08-03
Ultima actualizacion: 2026-08-03

## Objetivo

Actualizar el catalogo usando `PRODUCTOS MILA WEB/` como fuente de productos, imagen principal, galeria y variantes.

## Fuente actual

| Categoria | Productos | Imagenes |
|---|---:|---:|
| ALUMINIO | 24 | 139 |
| OUTLET | 6 | 27 |
| PLANTAS | 6 | 27 |
| PLASTICO | 33 | 215 |
| RATAN | 11 | 62 |
| Total | 80 | 470 |

## Criterio vigente

| Requisito | Criterio aplicado |
|---|---|
| Imagen principal | Requerida. Si hay varias, la primera por orden de archivo es destacada y las demas van a galeria. |
| Fondo real / Foto real | Opcional. Si existe, se agrega a galeria. Si no existe, se ignora. |
| Medidas | Opcional. Si existe, se agrega a galeria. Si no existe, se ignora. |
| Variantes | Opcionales. Si no hay imagenes de variantes, el producto se importa como version default con `colors: []`. |
| Imagen de variante | Si una variante tiene imagen valida, se importa como color/variante con `colors[].image`. |

## Resultado actual

| Estado | Cantidad |
|---|---:|
| Migrables | 80 |
| Bloqueados | 0 |
| Total productos | 80 |

## Mapeo a WordPress

| Origen | Destino WP |
|---|---|
| Primera imagen principal | `sourceImage`, featured image y `_milapro_main_image`. |
| Imagenes principales adicionales | `gallery` y `_milapro_gallery_images`. |
| Fondo real / Foto real | `gallery` y `_milapro_gallery_images` si existen. |
| Medidas | `gallery` y `_milapro_gallery_images` si existen. |
| Variantes con imagen | `colors[]` con `id`, `name`, `hex`, `image`, `available`. |
| Sin variantes | `colors: []`, version default. |

## Archivos generados

| Archivo | Uso |
|---|---|
| `scripts/build-productos-mila-web.mjs` | Genera manifest y copia imagenes desde `PRODUCTOS MILA WEB/`. |
| `public/productos-mila-web/` | Imagenes normalizadas para importacion/publicacion. |
| `wordpress/migration/productos-mila-web-products.json` | Manifest de los 80 productos migrables. |
| `wordpress/migration/productos-mila-web-blocked.json` | Manifest de bloqueados; actualmente vacio. |
| `wordpress/migration/seed.json` | Seed final de WordPress con 80 productos. |

## Notas

El importador de WordPress convierte tambien `colors[].image` a adjuntos para que el selector de variante pueda cambiar la imagen principal del producto.

El frontend actualiza la imagen principal de la galeria cuando se selecciona una variante con imagen.
