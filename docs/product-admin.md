# Configuracion de productos

## Fuente de datos

La plantilla `DECO_ABC_Plantilla_Inventario_Productos (1).xlsx` se relaciona con el CMS usando esta jerarquia:

- `Producto`: producto/categoria principal.
- `Familia(Subcategoria)`: variante del producto.
- `Variante / Color`: opcion/color de la variante.
- `Categoría de uso`: categoria `interior` o `exterior`.

La carga inicial considera los 112 registros que ya existen en `product_options`. La homologacion por slug encontro 60 coincidencias seguras en la plantilla; las otras 52 opciones existentes quedan publicadas, con precio temporal, pero pendientes de informacion tecnica.

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

El panel de admin debe exponer ambos niveles:

- interruptores globales para todos los productos;
- interruptores individuales dentro de la edicion de cada producto.

Las preguntas frecuentes y el contenido detallado de instalacion quedan pendientes de captura por el cliente.
