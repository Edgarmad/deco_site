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

El admin ahora ofrece campos guiados para esos datos, validación de servidor y un diagnóstico de la calculadora con los datos guardados. Conserva claves adicionales en JSON y formatos heredados no modificados. Las dimensiones lineales importadas pueden tener sección transversal como `290 x 10*5 cm`; el primer número es el largo y la sección nunca se usa como multiplicación para calcular cobertura.

## Archivos

- Los archivos de apoyo se suben desde la edición de un acabado y se guardan en `product_support_files` asociados a la familia/variante. Por eso un mismo PDF aparece en todos los acabados de esa familia.
- El bucket público `site-media` almacena los archivos en la ruta `support/<variant_id>/...`.
- `technical_sheet_url` e `installation_guide_url`: enlaces históricos conservados al editar; no se usan como respaldo en la página pública ni se editan desde el formulario de acabado.

La sección de apoyo también está disponible directamente en `/admin/variantes/{id}`. Permite editar títulos y orden. Los PDF de hasta 15 MB usan una subida directa firmada a Storage y solo aparecen públicamente después de la validación final; sin JavaScript el límite es 4 MB.

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


## Galería, muestra de variante y ficha técnica

Requiere la migración `20260930120000_product_gallery_roles.sql` antes de usar esta versión del CMS.

En «Imágenes y muestra del acabado / color» asigna el uso y guarda la imagen:

| Uso | Resultado público |
| --- | --- |
| Principal / catálogo | Visor inicial y tarjeta del producto. |
| Muestra para miniaturas de variantes / colores | Círculos de colores, independiente de la principal. Sin muestra se usa la principal. |
| Secundaria / primera miniatura | Primera miniatura bajo el visor. |
| Galería, adicional o técnica | Fotos restantes de la galería; «técnica» es una imagen de medidas, no un PDF. |

Si varias imágenes tienen el mismo uso, gana el menor número de orden; los empates se resuelven por UUID. La secundaria efectiva se coloca primero y las demás fotos conservan su orden relativo. Las muestras de color no se agregan a la galería. El admin identifica las imágenes efectivas y muestra una vista previa con el mismo componente del sitio.

En «Documentos de la familia», sube el PDF y luego selecciónalo en «PDF que se mostrará como ficha técnica». Puedes elegir «Sin ficha técnica en la galería». La selección no depende del nombre ni del orden del archivo. Esta elección se guarda en `product_variants.technical_support_file_id`, se comparte con todos los acabados y solo admite un PDF disponible de esa misma familia. Borrarlo limpia la selección automáticamente.

La ficha técnica ocupa la segunda miniatura. Seleccionarla carga el PDF en el visor principal; pulsar el visor abre el documento completo en otra pestaña. Los otros PDF conservan enlaces propios, ordenados. La miniatura de foto intercambia su imagen con la del visor para poder volver a la principal.

La visibilidad «Especificaciones del producto» controla los datos junto al precio. «Documentos en la galería» controla el PDF y los enlaces documentales. Ambas conservan las claves existentes y las opciones heredar, mostrar u ocultar.
