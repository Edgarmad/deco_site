# Configuracion de productos

## Fuente de datos

La plantilla `DECO_ABC_Plantilla_Inventario_Productos (1).xlsx` se relaciona con el CMS usando esta jerarquia:

- `Producto`: producto/categoria principal.
- `Familia(Subcategoria)`: variante del producto.
- `Variante / Color`: opcion/color de la variante.
- `Categoría de uso`: categoria `interior` o `exterior`.

El Excel es el inventario canonico. La carga actual contiene 160 combinaciones unicas; la fila duplicada de `ACCESORIOS / Soclo SPC / Humo` se ignora. Los productos que no aparecen en el Excel se retiran del catalogo publicado.

## Datos tecnicos

Los campos que no tienen una columna propia se guardan en `product_options.technical_specs` con estas claves:

- `weight`
- `presentation`
- `pieces_per_box`
- `coverage`
- `water_resistance`
- `fire_classification`

Por ahora no se cargan `coverage_type`, `coverage_unit` ni `warranty`.

Las dimensiones se guardan en `product_options.dimensions` como `Alto x Ancho cm`, conservando las unidades visibles. El precio inicial es `product_options.price = 1.00` para todos los productos.

## Datos obligatorios para la calculadora

La calculadora consume los textos guardados en `product_options.technical_specs` y `product_options.dimensions`. Para evitar cálculos incorrectos, el admin debe conservar exactamente estos formatos:

```json
{
  "presentation": "Caja",
  "pieces_per_box": "10 piezas",
  "coverage": "4.60 m²"
}
```

- `presentation`: texto comercial, por ejemplo `Caja`, `Paquete` o `Placa`.
- `pieces_per_box`: número entero seguido de `piezas`, por ejemplo `10 piezas`, o `N/A` cuando cada presentación equivale a una unidad.
- `coverage`: número positivo seguido obligatoriamente de `m²`, por ejemplo `4.60 m²`. No usar solo `4.60`.
- `dimensions`: debe escribirse como `Alto x Ancho cm`, por ejemplo `290 x 10 cm`. Para productos lineales, el primer valor es el largo de una pieza.
- No escribir unidades distintas, expresiones como `10*5`, texto adicional en medio, ni formatos ambiguos.
- Los productos lineales se identifican por su familia; no se debe intentar calcularlos usando `coverage`.

Los accesorios y productos sin rendimiento no deben recibir datos inventados para habilitar la calculadora. Si `pieces_per_box` es `N/A`, el cálculo considera una unidad por presentación.

## Archivos

- `technical_sheet_url`: enlace externo a la ficha tecnica en Drive.
- `installation_guide_url`: enlace externo a la guia de instalacion en Drive.

## Visibilidad de secciones

La visibilidad general se controla en `site_settings` con estas claves publicas:

- `product_section_technical_enabled`
- `product_section_support_enabled`
- `product_section_faq_enabled`
- `product_section_installation_enabled`

Cada registro puede tener una configuracion individual en `product_options.section_visibility`. Una clave con valor `false` oculta esa seccion solo para ese producto; una clave ausente hereda la configuracion global.

Las opciones sin imagen real reciben `fallback_image_path = products/_placeholder/product-placeholder.webp`. El archivo WebP se almacena una sola vez en Storage y se reutiliza como fallback.

El panel de admin expone ambos niveles:

- interruptores globales para todos los productos;
- interruptores individuales dentro de la edicion de cada producto.

Las preguntas frecuentes se capturan en `product_options.faq_items` (objeto JSON pregunta → respuesta), y la instalación en `installation_notes` (un paso por línea). El contenido definitivo queda pendiente de captura por el cliente.

El selector individual ofrece heredar, mostrar u ocultar cada sección. Ver [admin-cms.md](admin-cms.md) para el flujo completo de categorías, familias, variantes, acabados e imágenes.
