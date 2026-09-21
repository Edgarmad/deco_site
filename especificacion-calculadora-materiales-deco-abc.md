# Especificación para implementar la calculadora de materiales de DECO ABC

## 1. Objetivo

Implementar en las páginas de producto de DECO ABC una calculadora de materiales inspirada en la sección **“Calcula cuánto material necesitas para tu proyecto”** de SaroTech.

La calculadora debe determinar cuánto producto necesita el usuario a partir de:

- El área del proyecto en metros cuadrados.
- Las dimensiones base × altura del proyecto.
- Los metros lineales requeridos, cuando el producto sea una viga, ángulo, perfil estructural o quilla.

La fuente de información es la pestaña **Productos** del archivo `DECO_ABC_Plantilla_Inventario_Productos (1).xlsx`.

## 2. Resumen del inventario analizado

El Excel contiene 161 variantes de producto:

- 99 variantes tienen cobertura por área suficiente para una calculadora en m².
- 21 variantes deben calcularse por metros lineales.
- 41 variantes no tienen información suficiente o corresponden a accesorios, por lo que no mostrarán calculadora.

En total, **120 de las 161 variantes pueden tener calculadora** bajo las reglas de este documento.

## 3. Decisiones funcionales definitivas

Estas decisiones deben tratarse como requisitos, no como preguntas pendientes:

1. **La cobertura registrada en el Excel se considera el rendimiento comercial oficial.**
2. **Las placas de mármol PVC se calculan con la cobertura indicada en el Excel.** No es necesario conocer su empaque comercial exacto.
3. **Las vigas, ángulos y quillas se calculan por metros lineales.**
4. **No se agrega 10 % de desperdicio.** No debe aplicarse automática ni opcionalmente.
5. **Los productos sin información suficiente no muestran calculadora.**
6. El redondeo de presentaciones o unidades siempre se hace hacia arriba.
7. No se deben derivar ni sustituir rendimientos oficiales usando el área geométrica de las dimensiones cuando el Excel ya proporciona una cobertura.

## 4. Campos relevantes del Excel

La implementación debe leer estos campos:

| Campo | Uso |
|---|---|
| Producto | Determina la familia funcional general. |
| Familia (Subcategoría) | Identifica la línea o formato del producto. |
| Variante / Color | Identifica la variante mostrada. |
| Alto (cm) | Largo de la pieza; se usa para productos lineales. |
| Ancho (cm) | Dato informativo; no debe sustituir la cobertura oficial. |
| Presentación | Texto comercial de la presentación. |
| Piezas por caja | Permite obtener el número total de piezas cuando es numérico. |
| Tipo de cobertura | Indica si el cálculo es por área. Puede estar vacío en productos lineales. |
| Cobertura por presentación | Rendimiento comercial oficial para productos por área. |
| Unidad de cobertura | Normalmente m² para productos por área. |

El campo SKU está vacío en las 161 filas. La implementación deberá usar el identificador interno del CMS, slug o combinación de producto, familia y variante para relacionar la calculadora con el producto. No debe depender del SKU mientras siga vacío.

## 5. Clasificación de calculadoras

Cada variante debe clasificarse en uno de estos modos:

### 5.1. Calculadora por área

Se utiliza cuando:

- `Cobertura por presentación` contiene un número mayor que cero.
- `Unidad de cobertura` es `m²`.

El usuario puede introducir directamente los m² o usar base × altura.

### 5.2. Calculadora por metros lineales

Se utiliza para estos productos:

- VIGAS WPC.
- VIGA COEXTRUIDA.
- ANGULO ASA.
- ANGULO COEXTRUIDO.
- QUILLA WPC.

El usuario introduce los metros lineales requeridos.

### 5.3. Sin calculadora

No se muestra la sección de calculadora cuando:

- El producto no cumple las reglas de área ni pertenece a la lista de productos lineales.
- Falta el rendimiento necesario.
- No existe una longitud numérica utilizable.
- El producto es un accesorio sin regla de rendimiento.
- El producto es GRAPA DECK.

## 6. Fórmulas para productos por área

### 6.1. Entrada directa en m²

El usuario captura:

`m² totales = área introducida`

### 6.2. Entrada Base × Altura

Ambas medidas se capturan en metros:

`m² totales = base × altura`

### 6.3. Presentaciones requeridas

`presentaciones = redondear hacia arriba(m² totales / cobertura por presentación)`

### 6.4. Unidades requeridas

Si `Piezas por caja` contiene un número válido:

`unidades = presentaciones × piezas por caja`

Si `Piezas por caja` es `N/A` o está vacío, pero existe cobertura válida:

`unidades = presentaciones`

Esto aplica especialmente a las placas de mármol PVC. La interfaz puede etiquetar el resultado simplemente como **Unidades**.

### 6.5. Cobertura final

`m² cubiertos = presentaciones × cobertura por presentación`

La cobertura final se muestra con un máximo de dos decimales. Los cálculos internos deben conservar la precisión original del Excel.

### 6.6. Resultados visibles

La calculadora por área debe mostrar:

- m² totales.
- Unidades.
- Presentaciones, cuando exista una presentación comercial identificable.
- m² cubiertos.

Si no se conoce con certeza si la presentación es caja, paquete o placa, usar la etiqueta neutral **Presentaciones**.

## 7. Fórmulas para productos por metros lineales

### 7.1. Longitud de una pieza

Para las familias lineales, el campo `Alto (cm)` representa el largo de la pieza:

`longitud por pieza en metros = Alto (cm) / 100`

Ejemplos presentes en el inventario:

- 290 cm equivalen a 2.90 m lineales por pieza.
- 300 cm equivalen a 3.00 m lineales por pieza.

Los valores como `10*5`, `6*4`, `5*5` o `4*2.5` describen la sección transversal y no deben multiplicarse para calcular la cobertura lineal.

### 7.2. Piezas requeridas

`piezas requeridas = redondear hacia arriba(metros lineales solicitados / longitud por pieza)`

### 7.3. Presentaciones requeridas

Si `Piezas por caja` contiene un número válido:

`presentaciones = redondear hacia arriba(piezas requeridas / piezas por caja)`

`unidades entregadas = presentaciones × piezas por caja`

Si `Piezas por caja` es `N/A` o está vacío:

- Se considera que la presentación es una pieza.
- `presentaciones = piezas requeridas`.
- `unidades entregadas = piezas requeridas`.

### 7.4. Metros lineales cubiertos

`metros lineales cubiertos = unidades entregadas × longitud por pieza`

### 7.5. Resultados visibles

La calculadora lineal debe mostrar:

- Metros lineales solicitados.
- Unidades o piezas.
- Presentaciones, cuando corresponda.
- Metros lineales cubiertos.

## 8. Familias con calculadora por área

Las siguientes familias cuentan con cobertura por presentación y pueden usar la calculadora por m²:

| Producto / familia | Variantes | Cobertura por presentación | Piezas registradas |
|---|---:|---:|---:|
| LAMBRIN / Lambrín Premium 4 | 18 | 4.60 m² | 10 |
| LAMBRIN / Lambrin Max 3 | 6 | 5.85 m² | 10 |
| LAMBRIN / Lambrin Irregular | 6 | 4.35 m² | 10 |
| LAMBRIN / Lambrin Wavy Max | 7 | 5.80 m² | 10 |
| PANEL REFORZADO SPC | 9 | 11.60 m² | 10 |
| PLAFON PVC / 6 METROS | 8 | 18.00 m² | 10 |
| PLAFON PVC / 3 METROS | 8 | 8.70 m² | 10 |
| PLACAS MARMOL PVC / NATURALES | 9 | 3.48 m² | N/A |
| PLACAS MARMOL PVC / DESTELLOS | 9 | 3.48 m² | N/A |
| PISO SPC / Madera | 4 | 2.70 m² | 12 |
| PISO SPC / Granito | 3 | 1.80 m² | 10 |
| LAMBRIN ASA / Cepillado | 4 | 2.40 m² | 4 |
| LAMBRIN ASA / Veta | 2 | 2.40 m² | 4 |
| WALL CLADDING ASA / Cepillado | 2 | 2.90 m² | 10 |
| WALL CLADDING ASA / Veta | 2 | 2.90 m² | 10 |
| DECK COEXTRUIDO / Residencial | 2 | 1.50 m² | 5 |

Total: **99 variantes**.

## 9. Familias con calculadora lineal

| Producto | Variantes | Largo por pieza | Piezas por presentación |
|---|---:|---:|---:|
| VIGAS WPC | 6 | 2.90 m | 10 |
| VIGA COEXTRUIDA | 6 | 3.00 m | 4 |
| ANGULO ASA | 4 | 3.00 m | 1, al figurar N/A |
| ANGULO COEXTRUIDO | 4 | 3.00 m | 1, al figurar N/A |
| QUILLA WPC | 1 | 3.00 m | 10 |

Total: **21 variantes**.

Para estas variantes se debe ignorar cualquier valor vacío o incorrecto de `Tipo de cobertura` y `Unidad de cobertura`. La clasificación anterior tiene prioridad.

## 10. Productos sin calculadora

No deben mostrar calculadora:

- Los 40 registros cuyo producto general es ACCESORIOS.
- El registro GRAPA DECK.

Esto incluye, entre otros:

- Ángulo WPC registrado como accesorio.
- Bolsa de grapas para lambrín.
- Adhesivo Superbond.
- Pistola calafateadora.
- Soporte giratorio para viga WPC.
- Soclo SPC.
- Perfil de transición SPC.
- Perfil de remate.
- Grapas para deck.

No se debe inventar una regla de rendimiento para estos productos.

## 11. Validaciones de entrada

La interfaz debe cumplir estas reglas:

- Aceptar únicamente números positivos.
- No calcular con valores vacíos, cero, negativos, `NaN` o infinitos.
- Permitir decimales.
- No permitir que un resultado válido muestre cero presentaciones.
- Redondear presentaciones y piezas hacia arriba.
- Mantener los valores internos sin redondear hasta calcular el resultado final.
- Al cambiar de modo m² a Base × Altura, recalcular usando solamente los campos del modo seleccionado.
- Si la variante cambia, recalcular con los datos de la nueva variante.
- Si el producto no es elegible, no renderizar la calculadora.

## 12. Prioridad de los datos

Para evitar resultados inconsistentes, usar esta prioridad:

1. `Cobertura por presentación` del Excel, para productos por área.
2. `Alto (cm)` convertido a metros, para productos lineales.
3. `Piezas por caja`, cuando sea numérico.
4. Si `Piezas por caja` es `N/A`, considerar una unidad por presentación solamente en las reglas expresamente definidas en este documento.

No usar `alto × ancho × piezas` para reemplazar la cobertura por presentación.

## 13. Inconsistencias detectadas y tratamiento

Existen 13 variantes donde el área geométrica nominal no coincide con la cobertura comercial:

- Lambrin Irregular: las dimensiones arrojan 4.611 m², pero el Excel declara 4.35 m².
- Lambrin Wavy Max: las dimensiones arrojan 6.09 m², pero el Excel declara 5.80 m².

La calculadora debe usar **4.35 m²** y **5.80 m²**, respectivamente. La diferencia puede corresponder al ancho útil, ensambles, pestañas o traslapes.

## 14. Comportamiento esperado de la interfaz

### Productos por área

Mostrar:

- Selector “Calcula por m²”.
- Selector “Calcula Base × Altura”.
- Campo de m² o campos Base y Altura.
- m² totales.
- Unidades.
- Presentaciones, si aplica.
- m² cubiertos.

### Productos lineales

Mostrar:

- Campo “Metros lineales requeridos”.
- Metros lineales solicitados.
- Unidades o piezas.
- Presentaciones, si aplica.
- Metros lineales cubiertos.

### Productos no elegibles

No mostrar un formulario deshabilitado ni resultados en cero. Omitir completamente la sección de calculadora.

## 15. Ejemplos de aceptación

### Lambrín Premium 4

Datos:

- Cobertura: 4.60 m² por presentación.
- 10 piezas por caja.
- Área solicitada: 15 m².

Resultado:

- Presentaciones: 4.
- Unidades: 40.
- Cobertura: 18.40 m².

### Placa Mármol PVC

Datos:

- Cobertura: 3.48 m².
- Piezas por caja: N/A.
- Área solicitada: 10 m².

Resultado:

- Unidades: 3.
- Cobertura: 10.44 m².
- No es necesario identificar si comercialmente se denomina caja, paquete o placa.

### Viga coextruida

Datos:

- Largo: 300 cm, equivalente a 3 m.
- 4 piezas por presentación.
- Solicitud: 14 m lineales.

Resultado:

- Piezas mínimas por longitud: 5.
- Presentaciones: 2.
- Unidades entregadas: 8.
- Cobertura lineal: 24 m.

### Accesorio sin rendimiento

Si el producto es Adhesivo Superbond, Perfil de Remate o Grapa Deck, la calculadora no debe aparecer.

## 16. Criterios de aceptación técnica

La implementación se considera correcta cuando:

- Clasifica correctamente las 161 variantes: 99 por área, 21 lineales y 41 sin calculadora.
- Usa la cobertura comercial del Excel para los productos por área.
- Usa el largo de la pieza para los productos lineales.
- Redondea hacia arriba piezas y presentaciones.
- No agrega 10 % de desperdicio.
- Maneja `N/A` según las reglas definidas.
- No muestra calculadora en productos sin información suficiente.
- Reacciona correctamente al cambiar valores, modo o variante.
- No depende de SKU mientras ese campo permanezca vacío.
