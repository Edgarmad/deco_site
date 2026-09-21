# Reporte De Inventario Canónico

## Resultado

- Fuente: `DECO_ABC_Plantilla_Inventario_Productos (1).xlsx`.
- Filas leídas: 161.
- Combinaciones únicas cargadas: 160.
- Fila duplicada ignorada: fila 123, `ACCESORIOS / Soclo SPC / Humo`.
- Productos publicados: 15.
- Opciones publicadas: 160.
- Opciones con dimensiones: 144.
- Opciones sin dimensiones: 16.
- Opciones con imágenes reales: 67.
- Opciones usando imagen temporal: 93.
- Precio inicial: `$1.00` por opción.

## Productos Retirados

Los siguientes productos existían en Supabase, pero no forman parte del Excel canónico y fueron retirados del catálogo:

- Cristal Carbono
- Piedra Flexible
- Piedra Pu

Sus imágenes físicas pueden continuar en Storage hasta ejecutar una limpieza posterior; ya no tienen referencias activas en el catálogo.

## Registros Sin Medidas

Las 16 opciones sin alto o ancho en el Excel son accesorios:

- `ACCESORIOS / Bolsa de Grapas (lambrin) / Metálicas`
- `ACCESORIOS / Adhesivo Superbond / N/A`
- `ACCESORIOS / Pistola Calafateadora / N/A`
- `ACCESORIOS / Soclo SPC / Humo`
- `ACCESORIOS / Perfil de Transición SPC / Caramelo, Avellana, Bruma, Luna, Caliza`
- `ACCESORIOS / Perfil de Remate / Humo, Caramelo, Avellana, Bruma, Luna, Caliza`
- `GRAPA DECK / N/A / Metálico`

## Imagen Temporal

La imagen temporal se encuentra en:

```text
site-media/products/_placeholder/product-placeholder.webp
```

Su tamaño es aproximadamente 2 KB y se comparte mediante `fallback_image_path`. Cuando exista una imagen real, la página utiliza la imagen real y deja de mostrar el fallback.
