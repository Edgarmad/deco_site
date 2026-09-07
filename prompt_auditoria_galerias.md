# Prompt: Auditoria y migracion controlada de galerias de productos WordPress

Eres un asistente encargado de auditar y migrar galerias de productos desde una estructura local de carpetas hacia WordPress. El objetivo es reemplazar las galerias actuales de cada producto usando imagenes nuevas de galeria, sin alterar, borrar, reemplazar ni reasignar la imagen principal del producto.

Regla principal: la estructura de carpetas local es la fuente canonica para decidir que imagenes deben quedar en la galeria de cada producto. La imagen principal existente en WordPress es intocable y debe quedar blindada durante toda la migracion.

## 1. Contexto inicial obligatorio

Antes de hacer cualquier otra cosa:

1. Lee TODOS los archivos `.md` que existan en la raiz del proyecto/sitio. Estos archivos contienen contexto necesario sobre estructura, convenciones, auditorias previas, FTP/HostGator, Docker, scripts de migracion y hallazgos anteriores.
2. Usa WordPress local Docker como entorno de auditoria y prueba antes de cualquier accion remota.
3. Para produccion, usa solo el contexto FTP/HostGator documentado en los `.md`; no expongas credenciales en logs, respuestas ni archivos.
4. No ejecutes cambios destructivos en produccion sin confirmacion explicita del usuario.
5. No asumas que los nombres de carpeta y WordPress coinciden exactamente; aplica las reglas de normalizacion y coincidencia parcial descritas en este prompt.

## 2. Antecedentes importantes de la migracion anterior

Ya se realizo una auditoria y migracion de `1 fondo real` para imagen principal. Estos son hallazgos que deben considerarse para no repetir problemas:

- El catalogo canonico final quedo en `69` productos publicados en WordPress local y remoto.
- Los productos no canonicos fueron eliminados local y remoto.
- La imagen principal de cada producto quedo definida desde `1 fondo real` en `_milapro_main_image` y sincronizada con `featured_media`.
- La pagina de detalle depende de que la imagen principal de WordPress sea la primera imagen visible.
- En una migracion anterior se sobrescribio `_milapro_gallery_images` y se perdio temporalmente la relacion producto -> galeria anterior.
- Aunque los attachments antiguos no se borraron, la galeria quedo vacia o incompleta para productos con una sola imagen en `1 fondo real`.
- Se requirio un script de recuperacion para restaurar galerias desde `seed.json`.
- El frontend fue corregido para construir la galeria como `[mainImage, ...wpGallery]` cuando existe `main_image_url`.
- Cualquier nueva migracion de galerias debe asumir que `_milapro_main_image` y `featured_media` ya son correctos y no deben tocarse.

Problemas tecnicos detectados previamente:

- `iconv` dentro del contenedor puede perder letras acentuadas; preferir `remove_accents()` de WordPress y reemplazos explicitos para vocales acentuadas y `ñ`.
- HostGator/Linux diferencia mayusculas y minusculas; detectar carpetas esperadas de forma case-insensitive cuando sea razonable.
- Algunas carpetas locales tuvieron variaciones como `1 Fondo real` vs `1 fondo real`; para esta migracion, aplicar deteccion case-insensitive a `2 fondo blanco`, `3 medidas` y `4 variantes`.
- Una llamada remota puede devolver HTTP `500` aunque haya ejecutado parcialmente; revisar siempre el cuerpo/resumen de ejecucion y validar idempotencia antes de repetir.
- Los runners temporales remotos deben estar protegidos por header/token, no por token en URL, y deben eliminarse al terminar.
- No borrar attachments antiguos de Media Library durante la primera ejecucion; solo actualizar metadatos de galeria del producto.
- Quedan copias temporales de imagenes bajo `/cms/wp-content/uploads/milapro-fondo-real/PENDIENTE_FONDO_REAL_CORREGIDO/` por un error FTP `550`; no afectan la Media Library ni el frontend publico.
- Persiste una diferencia no relacionada entre local y remoto: slug `ratan-madrid`, local title `Madrid`, remote title `Madrid test`.

## 3. Estructura de carpetas a recibir

El usuario entregara una carpeta raiz nueva con categorias y productos. Debe tener los mismos productos y categorias que el catalogo canonico final de fondo real.

Ruta raiz local entregada por el usuario:

```text
C:\Users\edmad\Downloads\assets_r\1000x1000
```

Jerarquia esperada:

```text
{RAIZ_GALERIAS}/
  {categoria}/
    {producto}/
      2 fondo blanco/
      3 medidas/
      4 variantes/
```

Niveles:

- Nivel 1: carpetas de categoria.
- Nivel 2: carpetas de producto.
- Nivel 3: subcarpetas de galeria.

Subcarpetas reconocidas dentro de cada producto:

```text
2 fondo blanco
3 medidas
4 variantes
```

Los numeros `2`, `3` y `4` representan el orden canonico dentro de la galeria.

## 3.1 Hallazgos iniciales de la carpeta recibida

Fuente analizada:

```text
C:\Users\edmad\Downloads\assets_r\1000x1000
```

Resumen detectado:

- Categorias: `5`
- Productos/carpetas de producto: `80`
- Imagenes detectadas: `468`
- Extension detectada: `.png` exclusivamente
- Productos por categoria: `ALUMINIO: 24`, `OUTLET: 6`, `PLANTAS: 6`, `PLASTICO: 33`, `RATAN: 11`

Subcarpetas detectadas por nombre:

```text
77  2 fondo blanco
70  1 fondo real
63  3 Medidas
58  4 Variantes
10  3 variantes
3   4 Variedades
3   4 Variante
2   1 foto real
2   Fondo real
2   Imagen principal
1   Variedades
1   2 fondo real
1   4 medidas
1   Medidas
1   1 rondo real
1   Variante
```

Conteo de imagenes bajo subcarpetas esperadas exactas, con comparacion case-insensitive y lectura recursiva:

- `2 fondo blanco`: `171` imagenes
- `3 medidas`: `72` imagenes
- `4 variantes`: `107` imagenes
- Total exacto bajo carpetas canonicas: `350` imagenes
- Productos con al menos una imagen en carpetas canonicas exactas: `77`
- Productos sin imagenes en carpetas canonicas exactas: `3`

Carpetas similares no exactas que requieren decision antes de migrar:

- `4 Variante`, `4 Variedades`, `4 variedades`, `Variedades`, `Variante` parecen equivalentes a `4 variantes`, pero no deben mapearse automaticamente sin reportarlo.
- `3 variantes` no es equivalente claro a `3 medidas`; podria ser una carpeta de variantes mal numerada o mal nombrada. Debe reportarse y esperar confirmacion si se quiere mapearla a galeria.
- `Medidas` y `4 medidas` no siguen el formato esperado; deben reportarse.
- `Imagen principal`, `Fondo real`, `1 fondo real`, `1 foto real`, `1 rondo real` y `2 fondo real` no son fuente de galeria para esta migracion salvo confirmacion explicita. No deben tocar la imagen principal.

Productos sin imagenes bajo las tres carpetas canonicas exactas:

```text
ALUMINIO / MESA VOLGA 2.3 -> Fondo real | Imagen principal | Medidas | Variedades
OUTLET / TURKANA -> Fondo real | Imagen principal | Variante
PLASTICO / SILLETA IRIS -> 2 fondo real | 4 Variante
```

Productos con carpetas similares no exactas detectadas:

```text
ALUMINIO / MESA VOLGA 2.3 -> Variedades
OUTLET / LADOGA -> 3 variantes
OUTLET / LIENA -> 3 variantes
OUTLET / NYASA -> 3 variantes
OUTLET / TURKANA -> Variante
PLANTAS / AVE PARAISO -> 3 variantes
PLANTAS / OLIVO FA -> 3 variantes
PLANTAS / PALMA ARECA -> 3 variantes
PLASTICO / Mesa Auxiliar Anturio -> 3 variantes
PLASTICO / MESA AUXILIAR IRIS -> 3 variantes
PLASTICO / MESA CALA S CENTRAL -> 3 variantes
PLASTICO / SET IRIS -> 3 variantes
PLASTICO / SILLETA IRIS -> 4 Variante
RATAN / Barcelona 6 -> 4 Variante
RATAN / BILBAO -> 4 Variante
RATAN / MALAGA -> 4 Variedades
RATAN / MALAGA PETIT -> 4 variedades
RATAN / Sevilla -> 4 Variedades
```

Tambien se detectaron `26` carpetas de galeria con subcarpetas internas, principalmente colores como `Gris`, `Blanco`, `BEIGE`, `Blanca`, `Greige`, `Verde militar`, etc. Por lo tanto, el script debe leer imagenes de forma recursiva dentro de `2 fondo blanco`, `3 medidas` y `4 variantes`, preservando el orden por carpeta principal y luego orden natural por ruta/nombre dentro de esa carpeta.

Advertencia importante de catalogo:

- La carpeta nueva contiene `80` productos, pero la migracion anterior dejo el catalogo canonico en `69` productos.
- No asumir que los `80` productos deben migrarse.
- Antes de importar, comparar contra WordPress local y omitir o reportar productos no canonicos, incluyendo productos que fueron borrados durante la reconciliacion de fondo real.
- No recrear productos eliminados por el solo hecho de existir en esta carpeta de galerias.

## 4. Regla canonica de galeria

Para cada producto valido:

1. La imagen principal actual de WordPress debe conservarse intacta.
2. No modificar `_milapro_main_image`.
3. No ejecutar `set_post_thumbnail()`.
4. No usar ninguna imagen de estas carpetas como imagen principal.
5. Reemplazar completamente la galeria actual `_milapro_gallery_images` con las imagenes encontradas en las carpetas `2 fondo blanco`, `3 medidas` y `4 variantes`.
6. Mantener el orden por carpeta: primero todo lo de `2 fondo blanco`, despues todo lo de `3 medidas`, despues todo lo de `4 variantes`.
7. Si una subcarpeta contiene mas de una imagen, agregar todas sus imagenes a la galeria antes de pasar a la siguiente subcarpeta.
8. Dentro de cada subcarpeta, ordenar imagenes por nombre de archivo ascendente, usando comparacion natural si esta disponible.
9. Si una subcarpeta no existe o esta vacia, reportarla, pero no bloquear el producto si otras subcarpetas tienen imagenes validas.
10. Si un producto no tiene ninguna imagen valida en las tres subcarpetas, reportarlo como pendiente y no vaciar su galeria sin confirmacion explicita.

Ejemplo de orden:

```text
Producto X/
  2 fondo blanco/
    a.jpg
  3 medidas/
    medidas-01.jpg
    medidas-02.jpg
  4 variantes/
    variante-01.jpg
```

Galeria resultante:

```text
1. 2 fondo blanco/a.jpg
2. 3 medidas/medidas-01.jpg
3. 3 medidas/medidas-02.jpg
4. 4 variantes/variante-01.jpg
```

Importante: la imagen principal renderizada en el frontend seguira viniendo de `main_image_url`; la galeria migrada debe aparecer despues de esa imagen principal por el comportamiento actual de `src/services/productService.ts`.

## 5. Validacion de coincidencia antes de migrar

Antes de importar imagenes o modificar WordPress, audita la carpeta recibida contra el catalogo WordPress local.

### 5.1 Recolecta datos

- Recorre la carpeta raiz local y construye un listado de categoria -> producto -> existencia/contenido de `2 fondo blanco`, `3 medidas`, `4 variantes`.
- Consulta WordPress local via REST API para obtener productos publicados, slugs, titulos, categorias, `_milapro_main_image`, `featured_media`, `main_image_url`, `gallery_urls` y `product_details.gallery_images`.
- Confirma que el catalogo local de carpetas contiene los mismos productos canonicos que la migracion de fondo real.

### 5.2 Criterio de coincidencia

No se requiere coincidencia exacta de nombre. Usa coincidencia parcial/contencion, normalizando antes de comparar:

- Ignora mayusculas/minusculas.
- Ignora tildes y acentos.
- Reemplaza `ñ` por `n`.
- Ignora espacios extra, guiones y caracteres especiales.
- Considera que hay match si el nombre del producto en WordPress esta contenido como palabras clave dentro del nombre de carpeta, o viceversa.

Si hay ambiguedad, no migres ese producto. Reportalo como `coincidencia dudosa` para confirmacion manual.

### 5.3 Reporte obligatorio

Genera una tabla con estas columnas:

| Categoria | Producto (carpeta) | Producto (WordPress) | Slug | Match | 2 fondo blanco | 3 medidas | 4 variantes | Imagenes galeria nuevas | Imagen principal WP | Observacion |

Clasificaciones:

- `Match confirmado`: coincidencia clara.
- `Solo en carpeta`: existe carpeta pero no producto equivalente en WordPress.
- `Solo en WordPress`: existe producto en WordPress pero no carpeta equivalente.
- `Categoria distinta`: coincide el producto, pero categoria no coincide.
- `Sin imagenes de galeria`: no hay imagenes validas en ninguna de las tres subcarpetas.
- `Coincidencia dudosa`: requiere confirmacion manual.

Al final incluye resumen:

- Total de categorias en carpeta.
- Total de productos en carpeta.
- Total de productos WordPress.
- Matches confirmados.
- Productos sin imagenes de galeria.
- Productos solo en carpeta.
- Productos solo en WordPress.
- Coincidencias dudosas.
- Total estimado de imagenes nuevas de galeria.

Reglas de esta fase:

- No modificar, mover ni borrar archivos locales.
- No modificar WordPress.
- No avanzar a migracion hasta que el usuario confirme el reporte.

## 6. Modelo WordPress relevante

El plugin local `wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php` usa este modelo:

- Post type de productos: `products`.
- Taxonomia de categorias: `product_category`.
- Imagen principal del producto: post meta `_milapro_main_image` con ID numerico de attachment.
- Imagen destacada WordPress: sincronizada con `set_post_thumbnail($post_id, $main_image_id)`.
- Galeria del producto: post meta `_milapro_gallery_images`, como arreglo ordenado de objetos `['image' => attachment_id]`.
- REST `main_image_url`: devuelve `_milapro_main_image` como URL de Media Library o cae a `featured_media`.
- REST `gallery_urls`: recorre `_milapro_gallery_images` y devuelve URLs en el mismo orden guardado.

Para esta migracion solo se debe actualizar:

```text
_milapro_gallery_images
```

No actualizar:

```text
_milapro_main_image
featured_media
```

## 7. Nombres SEO para imagenes de galeria

Antes de importar cada imagen a WordPress Media Library, crear una copia temporal con nombre SEO. No renombrar destructivamente los archivos originales.

Regla obligatoria: al copiar las imagenes al CMS, renombrarlas siguiendo la misma regla base que se aplico para la imagen principal de fondo real. Es decir, el nombre debe partir de `{categoria-normalizada}-{producto-normalizado}` y conservar la misma normalizacion SEO usada en la migracion anterior.

Formato recomendado:

```text
{categoria-normalizada}-{producto-normalizado}-galeria-02-fondo-blanco.{ext}
{categoria-normalizada}-{producto-normalizado}-galeria-03-medidas.{ext}
{categoria-normalizada}-{producto-normalizado}-galeria-03-medidas-02.{ext}
{categoria-normalizada}-{producto-normalizado}-galeria-04-variantes.{ext}
{categoria-normalizada}-{producto-normalizado}-galeria-04-variantes-02.{ext}
```

Ejemplo, si la imagen principal quedo como:

```text
aluminio-caspio-fondo-real.png
```

Las imagenes de galeria deben nombrarse con la misma base:

```text
aluminio-caspio-galeria-02-fondo-blanco.png
aluminio-caspio-galeria-03-medidas.png
aluminio-caspio-galeria-03-medidas-02.png
aluminio-caspio-galeria-04-variantes.png
```

Si una carpeta contiene mas de una imagen, la primera no necesita sufijo numerico adicional y desde la segunda se usa `-02`, `-03`, etc. El numero `02`, `03` o `04` del bloque de galeria corresponde a la carpeta origen y no debe cambiar.

Reglas de normalizacion:

- Convertir a minusculas.
- Quitar tildes y acentos.
- Reemplazar `ñ` por `n`.
- Reemplazar espacios, guiones bajos y caracteres especiales por guiones.
- Colapsar guiones repetidos.
- Eliminar guiones al inicio y final.
- Mantener extension original salvo que se haga una optimizacion/conversion aprobada explicitamente.

Extensiones validas recomendadas:

```text
.jpg, .jpeg, .png, .webp
```

## 8. Persistencia esperada

Para cada producto con match confirmado y al menos una imagen valida de galeria:

1. Leer y guardar en el reporte el valor actual de `_milapro_main_image` y `featured_media` antes de tocar el producto.
2. Importar o reutilizar attachments de las imagenes de `2 fondo blanco`, `3 medidas`, `4 variantes`.
3. Guardar `_milapro_gallery_images` como arreglo ordenado:

```php
[
    ['image' => 123], // 2 fondo blanco
    ['image' => 124], // 3 medidas
    ['image' => 125], // 3 medidas
    ['image' => 126], // 4 variantes
]
```

4. Volver a leer `_milapro_main_image` y `featured_media`.
5. Validar que ambos valores siguen exactamente iguales que antes.
6. Si la imagen principal cambio por cualquier motivo, detener la migracion, reportar el producto afectado y no continuar con produccion.

Marcas de origen recomendadas para deduplicar:

```text
_milapro_gallery_source_path = ruta absoluta o relativa original del archivo local
_milapro_gallery_product_slug = slug del producto WordPress
_milapro_gallery_slot = 2-fondo-blanco|3-medidas|4-variantes
```

Tambien puede reutilizarse `_milapro_source_path` si el importador existente se extiende, pero la ruta usada para deduplicar debe ser la ruta original, no el nombre SEO temporal.

## 9. Script tecnico recomendado

Crear una migracion especifica y pequena para galerias, separada de la migracion de fondo real.

Archivo sugerido:

```text
wordpress/migration/import-product-galleries.php
```

Responsabilidades del script:

1. Cargar WordPress por WP-CLI.
2. Recibir o definir la ruta base de galerias.
3. Recorrer categorias y productos.
4. Detectar `2 fondo blanco`, `3 medidas`, `4 variantes` de forma case-insensitive.
5. Aplicar las mismas reglas de match de auditoria.
6. Omitir productos sin match confirmado.
7. Omitir productos sin imagenes validas, salvo confirmacion explicita para vaciar galeria.
8. Copiar cada imagen a temporal con nombre SEO antes de importar.
9. Importar usando APIs nativas de WordPress (`media_handle_sideload` o equivalente).
10. Evitar duplicados buscando attachments por meta de origen.
11. Actualizar solo `_milapro_gallery_images`.
12. Verificar que `_milapro_main_image` y `featured_media` no cambiaron.
13. Generar reporte JSON con productos procesados, imagenes importadas, imagenes reutilizadas, imagenes fallidas, productos pendientes y productos omitidos.
14. Soportar modo dry-run antes de escribir cambios.

Comando local esperado, si el archivo existe:

```powershell
docker compose --profile tools run --rm wpcli wp eval-file /var/www/html/migration/import-product-galleries.php
```

## 10. Reglas de seguridad de migracion

- La imagen principal queda blindada: no modificar `_milapro_main_image`, no modificar `featured_media`, no ejecutar `set_post_thumbnail()`.
- No incluir la imagen principal actual dentro de `_milapro_gallery_images` desde el script; el frontend ya antepone `mainImage` a la galeria.
- No borrar attachments antiguos de Media Library durante la primera migracion.
- No borrar imagenes locales.
- No vaciar galerias de productos sin imagenes nuevas salvo confirmacion explicita.
- No migrar productos con coincidencia dudosa.
- No ejecutar en produccion antes de validar localmente.
- Ejecutar primero dry-run y revisar reporte.
- Ejecutar una segunda pasada para validar idempotencia: debe reutilizar imagenes y no duplicarlas.
- Si algun producto cambia su imagen principal, detenerse y revertir solo ese cambio con confirmacion del usuario.

## 11. Validacion posterior local

Verificar productos con imagenes en una, dos y tres carpetas:

```text
GET /wp-json/wp/v2/products?slug={slug}&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
```

Resultado esperado:

- `featured_media` debe ser el mismo valor que antes de la migracion.
- `product_details.main_image` debe ser el mismo valor que antes de la migracion.
- `main_image_url` debe apuntar a la imagen principal existente de fondo real.
- `product_details.gallery_images` debe contener solo attachment IDs de las nuevas imagenes de galeria.
- `gallery_urls` debe devolver URLs de Media Library en el orden: `2 fondo blanco`, `3 medidas`, `4 variantes`.
- Si `3 medidas` tiene dos imagenes, ambas deben aparecer antes de cualquier imagen de `4 variantes`.
- Los nombres de archivo en Media Library deben seguir el formato SEO definido.
- El frontend debe renderizar la imagen principal primero y despues las imagenes de galeria nuevas.

Validar build local despues de confirmar datos:

```text
npm run build
npx tsc --noEmit
```

## 12. Produccion HostGator

Usar los datos documentados en los `.md` del proyecto. No imprimir contrasenas ni escribirlas en archivos nuevos.

Rutas relevantes ya conocidas:

```text
WordPress remoto: /cms/
Plugin remoto: /cms/wp-content/plugins/milapro-headless-cms/
Uploads remoto: /cms/wp-content/uploads/
```

Ruta remota recomendada para subir temporalmente imagenes/migracion de galerias:

```text
/cms/wp-content/uploads/milapro-galerias/
```

Estructura remota recomendada:

```text
/cms/wp-content/uploads/milapro-galerias/
  {RAIZ_GALERIAS}/
    {categoria}/
      {producto}/
        2 fondo blanco/
        3 medidas/
        4 variantes/
```

Subir solo archivos necesarios:

- `wordpress/migration/import-product-galleries.php`, si existe.
- Carpeta temporal de imagenes de galerias.
- Archivos modificados del plugin solo si fueron necesarios.

No subir:

- `.env`
- `node_modules`
- `dist` salvo que se haga deploy frontend confirmado
- archivos `.md`
- archivos no relacionados

La ejecucion remota debe hacerse dentro del contexto WordPress:

- WP-CLI desde cPanel/SSH si esta disponible.
- Herramienta temporal protegida dentro del plugin si no hay WP-CLI.
- Script temporal protegido, eliminado al terminar.

No ejecutar un PHP publico sin control de acceso.

Despues de ejecutar en produccion:

1. Eliminar runners temporales remotos.
2. Eliminar scripts temporales remotos si fueron subidos a uploads.
3. Verificar que sus URLs devuelven `404` o que no son accesibles.
4. Validar REST remoto para productos de muestra.
5. Confirmar idempotencia con una segunda pasada o dry-run posterior.

## 13. Verificacion publica final

Verificar REST remoto:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?slug={slug}&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
```

Resultado esperado:

- `main_image_url` sigue igual que antes de la migracion de galerias.
- `featured_media` sigue igual que antes.
- `product_details.main_image` sigue igual que antes.
- `gallery_urls` contiene las imagenes nuevas en orden canonico.

Verificar paginas publicas de productos:

```text
https://www.milaprohome.com/products/{slug}/
```

Resultado esperado:

- La primera imagen visible es la imagen principal de fondo real ya existente.
- Las siguientes imagenes visibles corresponden a `2 fondo blanco`, `3 medidas`, `4 variantes`.
- No aparecen galerias antiguas de `/productos-mila-web/...` si WordPress entrega galeria nueva.
- No hay duplicados entre imagen principal y galeria.

Si se requiere deploy frontend, ejecutar build y subir solo despues de validar que los datos CMS son correctos.

## 14. Plan de trabajo recomendado

1. Leer contexto `.md` completo.
2. Confirmar ruta raiz de la nueva carpeta de galerias.
3. Auditar carpetas vs WordPress local y generar tabla.
4. Esperar confirmacion del usuario.
5. Crear script `import-product-galleries.php` con dry-run e idempotencia.
6. Ejecutar dry-run local.
7. Ejecutar migracion local.
8. Validar REST local, imagen principal blindada y orden de galerias.
9. Ejecutar build local si afecta frontend/render estatico.
10. Confirmar con usuario antes de produccion.
11. Subir imagenes/scripts temporales a `/cms/wp-content/uploads/milapro-galerias/`.
12. Ejecutar dry-run remoto.
13. Ejecutar migracion remota.
14. Validar REST remoto y paginas publicas.
15. Eliminar scripts/runners temporales remotos.
16. Reportar resumen final con importadas, reutilizadas, fallidas, omitidas y cualquier pendiente.

## 15. Criterio de exito

La tarea solo se considera terminada cuando:

- Todos los productos con match confirmado tienen galeria reemplazada por imagenes nuevas.
- El orden de galeria respeta `2 fondo blanco`, `3 medidas`, `4 variantes`.
- Las imagenes multiples dentro de una subcarpeta conservan orden antes de pasar a la siguiente.
- Ninguna imagen principal fue reemplazada, borrada o reasignada.
- `_milapro_main_image` y `featured_media` son iguales antes y despues.
- No hay duplicados innecesarios en Media Library en segunda ejecucion.
- No quedan scripts temporales publicos activos.
- Local y remoto quedan verificados por REST.
- El frontend publico muestra la principal primero y la galeria nueva despues.

## 16. Ejecucion local de galerias 2026-08-31

Fuente local usada:

```text
C:\Users\edmad\Downloads\assets_r\1000x1000
```

Mount local agregado para WP-CLI Docker:

```yaml
- C:/Users/edmad/Downloads/assets_r/1000x1000:/var/www/html/product-galleries:ro
```

Script creado:

```text
wordpress/migration/import-product-galleries.php
```

Comandos ejecutados localmente:

```powershell
docker compose --profile tools run --rm --no-deps wpcli php -l /var/www/html/migration/import-product-galleries.php
docker compose --profile tools run --rm wpcli wp eval-file /var/www/html/migration/import-product-galleries.php
docker compose --profile tools run --rm -e MILAPRO_GALLERIES_DRY_RUN=0 wpcli wp eval-file /var/www/html/migration/import-product-galleries.php
```

Resultado de dry-run local:

- Productos escaneados: `80`
- Productos procesables: `69`
- Productos omitidos por no canonicos: `11`
- Imagenes planificadas: `311`
- Productos pendientes: `0`
- Imagenes principales intactas: `69`

Resultado de migracion local:

- Productos procesados: `69`
- Productos actualizados: `69`
- Imagenes importadas: `311`
- Imagenes fallidas: `0`
- Productos pendientes: `0`
- `_milapro_main_image` sin cambios: `69`
- `featured_media` sin cambios: `69`

Correccion aplicada durante validacion local:

- La primera pasada genero nombres `galeria-2-fondo-blanco`, `galeria-3-medidas`, `galeria-4-variantes`.
- Se corrigio el script para usar `galeria-02-fondo-blanco`, `galeria-03-medidas`, `galeria-04-variantes`.
- Se renombraron los `311` attachments locales recien importados por esta migracion.
- Pasada posterior idempotente: `images_imported: 0`, `images_reused: 311`, `images_renamed: 0`, `images_failed: 0`.

Validacion REST local posterior:

```text
http://localhost:8081/wp-json/wp/v2/products?per_page=100&_fields=slug,featured_media,product_details,gallery_urls,main_image_url
```

Resumen REST local:

- Productos publicados: `69`
- Total `gallery_urls`: `311`
- Productos sin galeria: `0`
- Productos con diferencia entre `_milapro_main_image` y `featured_media`: `0`
- URLs de galeria fuera de `/wp-content/uploads/`: `0`

Productos de muestra verificados:

- `aluminio-caspio`: `3` imagenes de galeria, principal `845`, featured `845`.
- `aluminio-onega-esquinero`: `10` imagenes de galeria, principal `857`, featured `857`.
- `plantas-olivo-fa`: `1` imagen de galeria, principal `873`, featured `873`.
- `ratan-madrid`: `8` imagenes de galeria, principal `910`, featured `910`.
- `outlet-ladoga`: `2` imagenes de galeria, principal `866`, featured `866`.
- `plastico-mesa-licerna`: `4` imagenes de galeria, principal `888`, featured `888`.

Validacion de build local posterior:

```text
npm run build
npx tsc --noEmit
```

Resultados:

- Build Astro correcto: `86` paginas generadas.
- TypeScript correcto: sin errores.

Productos/carpetas omitidos por no canonicos, para revisar aparte:

```text
ALUMINIO / MESA VOLGA 2.3
ALUMINIO / SILLONES CASPIO
OUTLET / TURKANA
PLANTAS / PALMA ARECA
PLASTICO / Mesa Cala
PLASTICO / MESA LOTO
PLASTICO / SILLA ALTA DATURA
PLASTICO / SILLA ALTA NARCISO
PLASTICO / SILLETA IRIS
PLASTICO / SILLON ANTURIO
PLASTICO / SILLONES NARCISO
```

Decisiones tomadas antes de produccion (2026-08-31):

- Produccion recibe exactamente la misma migracion que los `69` productos canonicos validados en local.
- Las carpetas similares no canonicas (`3 variantes`, `4 Variante`, `4 Variedades`, `Medidas`, `Variedades`) siguen excluidas; no se mapean manualmente.
- De los `11` productos/carpetas omitidos, el usuario decidio:
  - `ALUMINIO / MESA VOLGA 2.3` y `ALUMINIO / SILLONES CASPIO`: ignorar y eliminar definitivamente (fuera de alcance de esta migracion de galerias).
  - Los otros `9` (`OUTLET / TURKANA`, `PLANTAS / PALMA ARECA`, `PLASTICO / Mesa Cala`, `PLASTICO / MESA LOTO`, `PLASTICO / SILLA ALTA DATURA`, `PLASTICO / SILLA ALTA NARCISO`, `PLASTICO / SILLETA IRIS`, `PLASTICO / SILLON ANTURIO`, `PLASTICO / SILLONES NARCISO`): se audito si quedaba registro de metadatos utilizable (post `products` en WordPress, o entrada viva en el catalogo estatico legacy `src/data/products.ts` que actua como fallback en `productService.ts`). Resultado: ninguno tiene post `products` en WordPress (ni publish/draft/trash); `8` de los `9` si existen en `src/data/products.ts` (fallback en vivo), pero sin post WordPress no hay donde anclar `_milapro_gallery_images`. Dado que no hay suficiente certeza de estructura (advertencias de carpetas duplicadas/ambiguas por producto, ver seccion 3.1) se decidio **ignorar los 9 por completo, sin aplicar ninguna regla especial ni tocar WordPress ni el catalogo estatico**, para no arriesgar una migracion parcial o incorrecta.

## 17. Ejecucion en produccion HostGator 2026-08-31

Contexto de acceso: en produccion solo hay credenciales FTP documentadas (`HOSTGATOR_FTP_CONTEXT.md`, `PLUGIN_CHANGE_CONTEXT.md`), no hay SSH ni WP-CLI. El script `wordpress/migration/import-product-galleries.php` requiere `WP_CLI`, por lo que no puede ejecutarse tal cual en produccion.

### 17.1 Verificacion previa en produccion

Antes de tocar nada, se confirmo via REST publico que produccion ya tenia los `69` productos canonicos con `main_image_url`/`featured_media` definidos (migracion de fondo real previa) y con galerias legacy (`/productos-mila-web/...`, nombres `main-01`, `gallery-main-01`, etc.), no vacias. Esto confirmo que la regla 5 ("reemplazar completamente la galeria actual") aplicaba de lleno.

### 17.2 Mecanismo elegido para ejecutar en produccion sin SSH/WP-CLI

Se evaluo primero un runner HTTP protegido por token en un archivo suelto (`_migration_runner.php`) fuera de wp-admin. El clasificador de seguridad de Claude Code bloqueo la subida por FTP de ese archivo: el patron (bootstrap de WordPress + autenticacion por header secreto + despacho de acciones dinamico) es indistinguible de un webshell, aunque la intencion fuera legitima y temporal.

Se descarto ese enfoque y en su lugar se porto la misma logica de `import-product-galleries.php` (sin la dependencia de `WP_CLI`) a una herramienta dentro del propio plugin, autenticada con el login real de wp-admin del usuario (no con un token inventado):

- Archivo nuevo: `wordpress/plugins/milapro-headless-cms/includes/class-gallery-migration-admin.php` (clase `Milapro_Gallery_Migration_Admin`).
- Registrada en `milapro-headless-cms.php` con el mismo patron que `Milapro_Seed_Import_Admin` (arreglo `$milapro_required_files` + `add_action('plugins_loaded', [...])`).
- Pagina en `Herramientas > Migracion Galerias MilaPro`, capability `manage_options`, todas las acciones AJAX protegidas con `check_ajax_referer()` (nonce), igual que el importador de seed existente.
- Botones: `1. Ver estado`, `2. Extraer ZIP`, `3. Dry-run`, `4. Ejecutar migracion real`, `5. Limpiar archivos temporales`.
- Antes de subir a produccion, la logica portada se valido localmente contra Docker con `ReflectionMethod` sobre el metodo privado `run_migration()`, reproduciendo exactamente el mismo resultado que la corrida local por WP-CLI (`69` procesados, `311` imagenes, `main_image_unchanged: 69`, sin errores).

Imagenes fuente: se armo un paquete filtrado (solo subcarpetas `2 fondo blanco`, `3 medidas`, `4 variantes`, excluyendo los `11` productos no canonicos) -> `311` archivos, `~203MB`. Se subio como `wp-content/uploads/milapro-galerias/gallery-source.zip` junto con `import-product-galleries.php` (usado solo como referencia de logica, no ejecutado directamente en produccion).

### 17.3 Errores encontrados y soluciones

1. **Rutas con backslash literal al extraer el ZIP.** El primer ZIP se genero con `Compress-Archive` de PowerShell, que escribe los nombres de entrada con `\` como separador. Al extraerlo con `ZipArchive` en el Linux de HostGator, cada entrada se creo como un archivo suelto con `\` literal en el nombre (ej. `ALUMINIO\BAHÍA ESQUINERA\2 fondo blanco\...png`) en vez de crear carpetas reales. Es el mismo problema ya documentado en `HOSTGATOR_DEPLOY_CONTEXT.md` para el ZIP del plugin. Diagnosticado listando el directorio extraido por FTP (`curl` a la URL FTP de `1000x1000/`). Primer sintoma: dry-run devolvia `products_scanned: 0` sin errores explicitos.
   - Solucion: reconstruir el ZIP con `System.IO.Compression.ZipFile` + `ZipFileExtensions.CreateEntryFromFile()`, forzando `Replace('\', '/')` en el nombre de cada entrada. Verificado que las tildes (ej. `BAHÍA`) quedaron en UTF-8 correcto revisando los bytes de la entrada antes de subir. Tras resubir el ZIP y volver a extraer, el dry-run confirmo `products_scanned: 69`, `images_planned: 311`, con los nombres acentuados matcheando bien contra WordPress.

2. **Timeout/error fatal de PHP en la migracion real (lotes fijos de 5 productos).** Al ejecutar `4. Ejecutar migracion real` con un lote fijo de `5` productos por request, la primera corrida se detuvo tras `7` productos con `Error: SyntaxError: Unexpected token '<'` (la respuesta AJAX era la pagina HTML de error critico de WordPress, no JSON), señal de que HostGator mato la request por tiempo de ejecucion. Verificado por REST que la imagen principal no se toco en ninguno de los `69` (la salvaguarda de `main_image_unchanged` funciono), solo quedo incompleta la galeria.
   - Primera correccion: se agrego procesamiento por lotes con offset/limite y auto-continuacion en el JS del admin (`runMigrateBatches()`), con lote fijo de `5` productos. Persistio el mismo error en un lote posterior (offset 45), porque el limite real no es la cantidad de productos sino la cantidad de imagenes a procesar por request (`media_handle_sideload` genera varios tamaños por imagen); un lote de `31` imagenes fallo cuando uno de `28` si habia pasado.
   - Correccion final: el lote se calcula por **presupuesto de imagenes** (`MAX_IMAGES_PER_BATCH = 12`), no por cantidad de productos — se van agregando productos al lote mientras no se supere el presupuesto, garantizando al menos un producto por lote aunque el tuviera mas imagenes que el presupuesto. Reintentar desde el boton es seguro por la deduplicacion existente por `_milapro_gallery_source_path` (los productos ya migrados se reportan como `images_reused`, no se duplican ni se vuelven a subir).

3. **Exposicion accidental de una contraseña.** Durante la sesion, una seleccion de texto en el editor expuso el contenido de una linea de `.env` (aparentaba ser una contraseña) dentro del contexto de la conversacion. No se repitio ni se uso el valor; se recomendo al usuario rotar esa credencial si es real.

### 17.4 Resultado final verificado

Ejecucion completa sin abortos ni fallos:

```text
products_updated: 69
images_imported: 90
images_reused: 221
images_failed: 0
main_image_unchanged: 69
errors: []
main_image_changed: []
```

Verificacion posterior via REST publico (`/wp-json/wp/v2/products?per_page=100&_fields=...`), comparando contra el snapshot tomado antes de la migracion:

- `69` productos, `0` con `main_image_url`/`featured_media` distinto al valor previo.
- `69` productos con `gallery_urls` compuesta enteramente por archivos con el nuevo patron SEO (`-galeria-02-fondo-blanco`, `-03-medidas`, `-04-variantes`).
- `311` imagenes de galeria en total (coincide exactamente con lo planificado).
- Verificado el orden en un producto de galeria larga (`ratan-madrid`, `8` imagenes): `2 fondo blanco` (x2) -> `3 medidas` (x4) -> `4 variantes` (x2), tal como exige la regla de orden de la seccion 4.

### 17.5 Pendiente de cierre

- Ejecutar `5. Limpiar archivos temporales` en `Herramientas > Migracion Galerias MilaPro` (borra `gallery-source.zip` y la carpeta `1000x1000/` extraida bajo `wp-content/uploads/milapro-galerias/`; no toca Media Library ni productos).
- Eliminar por FTP `wordpress/plugins/milapro-headless-cms/includes/class-gallery-migration-admin.php` en produccion y quitar su registro en `milapro-headless-cms.php` (la linea en `$milapro_required_files` y el `add_action('plugins_loaded', ['Milapro_Gallery_Migration_Admin', 'init'])`), para no dejar la herramienta de migracion expuesta en produccion de forma permanente.
- El usuario ejecutara manualmente el boton `Deploy` (Products list en wp-admin) para publicar el frontend Astro con las galerias nuevas.
