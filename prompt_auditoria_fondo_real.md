# Prompt: Auditoría y reconciliación de carpetas vs catálogo WordPress

Eres un asistente encargado de auditar una estructura de carpetas de productos y validar que coincida con el catálogo de productos publicado en WordPress. Para la auditoría local, toma como referencia el WordPress local disponible en Docker. Para producción, los productos locales y WordPress local deben coincidir con lo publicado por FTP/HostGator.

Regla principal: la estructura de carpetas local es la fuente canónica para decidir qué productos deben existir en WordPress.

## 1. Contexto inicial (léelo primero, siempre)

Antes de hacer cualquier otra cosa:

1. Lee TODOS los archivos `.md` que existan en la raíz del proyecto/sitio (no solo el primero que encuentres). Estos archivos contienen contexto necesario (estructura del proyecto, convenciones, notas previas, etc.) — asimílalo antes de continuar.
2. Para auditoría local, verifica el WordPress Docker local y usa su REST API como fuente del catálogo WordPress.
3. Para verificación/despliegue de producción, usa el contexto FTP/HostGator documentado en los `.md` y no expongas credenciales en logs, respuestas ni archivos.
4. Si algún `.md` referencia otras fuentes de verdad (por ejemplo, REST API, seed/importador, plugin específico, export de productos o una tabla de la base de datos), tenlo en cuenta para el resto de la tarea.

## 2. Estructura de carpetas a auditar

Ruta raíz (Windows, local):
```
C:\Users\edmad\Downloads\assets_new\PENDIENTE_FONDO_REAL_CORREGIDO
```

Jerarquía esperada dentro de esa ruta:

```
PENDIENTE_FONDO_REAL_CORREGIDO/
  └── {categoria}/
        └── {producto}/
              └── "1 fondo real"/   <- subcarpeta fija dentro de cada producto
```

- Nivel 1: carpetas de **categoría**.
- Nivel 2: carpetas de **producto** (varias por categoría).
- Nivel 3: subcarpeta obligatoria llamada exactamente `1 fondo real` dentro de cada producto.

Importante: si una carpeta de producto no contiene la subcarpeta `1 fondo real`, ese producto se considera eliminado del catálogo canónico y debe eliminarse de WordPress durante la fase de reconciliación.

## 3. Fase 1 — Validación de coincidencia (obligatoria antes de seguir)

### 3.1 Recolecta los datos
- Recorre recursivamente la carpeta raíz local y construye un listado de: categoría → producto → si existe o no la subcarpeta `1 fondo real` (y si tiene contenido o está vacía).
- Vía WordPress local + contexto de los `.md`, obtén el listado real de productos publicados en WordPress, con su categoría asociada.
- Si luego se compara contra producción, valida que WordPress local y el WordPress publicado por HostGator/FTP tengan el mismo catálogo antes de hacer cambios destructivos.

### 3.2 Criterio de coincidencia (IMPORTANTE)
No se requiere coincidencia exacta de nombre. Usa **coincidencia parcial/contención**, normalizando antes de comparar:
- Ignora mayúsculas/minúsculas.
- Ignora tildes y acentos.
- Ignora espacios extra, guiones y caracteres especiales.
- Considera que hay match si el nombre del producto en WordPress está **contenido** (como subcadena de palabras clave) dentro del nombre de la carpeta, o viceversa.

Ejemplo: `Silla rodan` (WordPress) coincide con `Silla rodan de plastico` (carpeta), porque las palabras clave principales (`silla`, `rodan`) están presentes en ambos. Esto se considera el **mismo producto**.

Si tienes dudas genuinas sobre si dos nombres se refieren al mismo producto (coincidencia parcial débil, ambigua, o coincidencia con más de un producto candidato), NO asumas automáticamente — repórtalo como "coincidencia dudosa" para revisión manual, con los candidatos posibles.

### 3.3 Reporta el resultado en una tabla, con estas columnas:
| Categoría | Producto (carpeta) | Producto (WordPress) | Match | Tiene "1 fondo real" | Observación |

Y clasifica cada fila como:
- ✅ **Match confirmado** — coincidencia clara, incluso si el nombre no es idéntico.
- ⚠️ **Solo en carpeta** — existe la carpeta pero no hay producto equivalente en WordPress.
- ⚠️ **Solo en WordPress** — existe el producto en WordPress pero no hay carpeta equivalente.
- ⚠️ **Categoría distinta** — el producto coincide en nombre pero está en otra categoría en WordPress vs la carpeta.
- ⚠️ **Sin "1 fondo real"** — el producto coincide pero la subcarpeta no existe o está vacía.
- ❓ **Coincidencia dudosa** — hay ambigüedad, requiere confirmación manual.

### 3.4 Criterio canónico después de la auditoría

Después de generar la tabla, aplica estas reglas para decidir la acción pendiente:

- Si existe en carpeta local y tiene `1 fondo real` con contenido, debe existir en WordPress.
- Si existe en carpeta local y no existe en WordPress, debe agregarse a WordPress.
- Si existe en WordPress pero no existe en carpeta local, debe borrarse de WordPress.
- Si existe la carpeta de producto pero no existe la subcarpeta `1 fondo real`, debe tratarse como producto eliminado y borrarse de WordPress.
- Si existe la subcarpeta `1 fondo real` pero está vacía, repórtalo para revisión antes de borrar o conservar.
- Si hay coincidencia dudosa, no borres ni agregues automáticamente hasta que el usuario confirme el mapeo correcto.
- Si el producto coincide pero la categoría difiere, actualiza la categoría de WordPress para que coincida con la carpeta canónica, salvo que el usuario indique lo contrario.

### 3.5 Reglas de esta fase
- No modifiques, muevas ni borres archivos ni carpetas en esta fase.
- No avances a ninguna otra tarea hasta que el usuario confirme el resultado de esta tabla.
- Al final de la tabla, incluye un resumen breve: cantidad total de categorías, productos en carpeta, productos en WordPress, matches confirmados, y cuántos casos requieren revisión.

## 4. Fase 2 — Pendiente

Una vez el usuario confirme que la Fase 1 es correcta, ejecuta la reconciliación del catálogo usando la carpeta local como fuente canónica.

Acciones esperadas:

1. Borrar de WordPress los productos marcados como `Solo en WordPress`.
2. Borrar de WordPress los productos que tengan carpeta local pero no tengan subcarpeta `1 fondo real`.
3. Agregar a WordPress los productos marcados como `Solo en carpeta`, siempre que tengan `1 fondo real` con contenido.
4. Corregir categorías distintas para que WordPress coincida con la categoría de la carpeta.
5. Mantener en espera los casos `Coincidencia dudosa` hasta confirmación manual.
6. Al terminar, volver a ejecutar la auditoría y confirmar que WordPress coincide con las carpetas canónicas.

No ejecutes cambios destructivos en producción sin confirmar primero si deben aplicarse solo en WordPress local, en WordPress remoto, o en ambos.

## 5. Fase 3 — Migración de imágenes desde `1 fondo real`

Después de reconciliar el catálogo, las imágenes dentro de cada subcarpeta `1 fondo real` serán la fuente canónica para la imagen principal y la galería de cada producto.

### 5.1 Modelo actual del plugin de productos

El plugin local `wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php` usa este modelo:

- Post type de productos: `products`.
- Taxonomía de categorías: `product_category`.
- Imagen principal del producto: post meta `_milapro_main_image` con ID numérico de attachment.
- Imagen destacada WordPress: se sincroniza con `set_post_thumbnail($post_id, $main_image_id)`.
- Galería del producto: post meta `_milapro_gallery_images`, como arreglo ordenado de objetos `['image' => attachment_id]`.
- REST `main_image_url`: devuelve `_milapro_main_image` como URL de Media Library o cae a `featured_media`.
- REST `gallery_urls`: recorre `_milapro_gallery_images` y devuelve las URLs en el mismo orden guardado.
- La UI del producto permite seleccionar imagen principal y agregar/remover/reordenar imágenes de galería con botones `Move up` y `Move down`.

El importador actual `Milapro_Seed_Media_Importer::attachment($source, $title)` evita duplicados usando el meta `_milapro_source_path`, pero toma el nombre del archivo desde el basename del `$source`. Por eso, para cumplir la regla SEO de nombres, el proceso nuevo debe controlar el nombre de archivo antes de importar a Media Library.

### 5.2 Regla canónica de imágenes

Para cada producto válido del catálogo canónico:

1. Buscar su carpeta local `{categoria}/{producto}/1 fondo real/`.
2. Listar solo archivos de imagen válidos dentro de esa carpeta.
3. Si hay una sola imagen, esa imagen será la imagen principal del producto.
4. Si hay más de una imagen, la primera imagen según orden determinístico será la imagen principal y las demás irán a la galería.
5. Si no hay imágenes válidas dentro de `1 fondo real`, reportar el producto como pendiente de imagen y no sobrescribir sus imágenes actuales sin confirmación.

Extensiones válidas recomendadas:

```text
.jpg, .jpeg, .png, .webp
```

Orden determinístico recomendado cuando haya varias imágenes:

1. Ordenar por nombre de archivo ascendente, usando comparación natural si está disponible.
2. Si hay nombres equivalentes o ambiguos, conservar el orden devuelto por el sistema de archivos solo como último recurso y reportarlo.

### 5.3 Regla de nombres SEO

Antes de importar cada imagen a WordPress Media Library, renombrarla con un nombre basado en el producto.

Formato recomendado:

```text
{categoria-normalizada}-{producto-normalizado}-fondo-real.{ext}
{categoria-normalizada}-{producto-normalizado}-fondo-real-02.{ext}
{categoria-normalizada}-{producto-normalizado}-fondo-real-03.{ext}
```

Ejemplos:

```text
aluminio-bahia-esquinera-fondo-real.jpg
aluminio-bahia-esquinera-fondo-real-02.jpg
aluminio-bahia-esquinera-fondo-real-03.jpg
plastico-mesa-licerna-fondo-real.webp
plastico-mesa-licerna-fondo-real-02.webp
```

Normalización del nombre:

- Convertir a minúsculas.
- Quitar tildes y acentos.
- Reemplazar `ñ` por `n`.
- Reemplazar espacios, guiones bajos y caracteres especiales por guiones.
- Colapsar guiones repetidos.
- Eliminar guiones al inicio y final.
- Mantener la extensión original salvo que se haga una optimización/conversión explícitamente aprobada.

No renombrar destructivamente los archivos originales dentro de la carpeta local durante la auditoría. Para importar, crear una copia temporal con el nombre SEO y usar esa copia como archivo fuente de Media Library.

### 5.4 Persistencia esperada en WordPress

Para cada producto importado o actualizado:

1. Importar la imagen principal a Media Library con nombre SEO.
2. Guardar su attachment ID en `_milapro_main_image`.
3. Ejecutar `set_post_thumbnail($post_id, $main_image_id)` para que también sea `featured_media`.
4. Importar las imágenes restantes con nombres SEO numerados.
5. Guardar la galería en `_milapro_gallery_images` como arreglo ordenado:

```php
[
    ['image' => 123],
    ['image' => 124],
    ['image' => 125],
]
```

6. Guardar una marca de origen en cada attachment para evitar duplicados en ejecuciones repetidas.

Marca de origen recomendada:

```text
_milapro_fondo_real_source_path = ruta absoluta o relativa original del archivo local
_milapro_fondo_real_product_slug = slug del producto WordPress
```

También puede reutilizarse `_milapro_source_path` si el importador existente se extiende para esta migración, pero la ruta usada para deduplicar debe ser la ruta original, no solo el nombre SEO temporal.

### 5.5 Acción técnica recomendada

Crear una migración específica y pequeña para fondo real, en vez de reutilizar el seed completo.

Archivo sugerido:

```text
wordpress/migration/import-fondo-real-images.php
```

Responsabilidades del script:

1. Cargar WordPress por WP-CLI.
2. Recorrer `C:\Users\edmad\Downloads\assets_new\PENDIENTE_FONDO_REAL_CORREGIDO` cuando se ejecute localmente, o una ruta equivalente montada/subida cuando se ejecute en producción.
3. Aplicar las mismas reglas de match de la Fase 1 para encontrar el producto WordPress correcto.
4. Omitir productos eliminados o sin `1 fondo real`.
5. Copiar cada imagen a un archivo temporal con nombre SEO antes de importarla.
6. Importar usando APIs nativas de WordPress (`media_handle_sideload` o equivalente).
7. Evitar duplicados buscando primero attachments por meta de origen.
8. Actualizar `_milapro_main_image`, `featured_media` y `_milapro_gallery_images`.
9. Generar reporte JSON con productos procesados, imágenes importadas, imágenes reutilizadas, imágenes fallidas y productos pendientes.

Comando local esperado, si el archivo existe:

```powershell
docker compose --profile tools run --rm wpcli wp eval-file /var/www/html/migration/import-fondo-real-images.php
```

### 5.6 Reglas de seguridad

- No sobrescribir imágenes existentes en WordPress si el producto no tiene match confirmado.
- Procesar `ALUMINIO / SILLONES CASPIO` como el producto WordPress `Caspio` con slug `aluminio-caspio`, según confirmación manual del usuario.
- No borrar attachments antiguos de Media Library durante la primera migración; solo actualizar los metadatos del producto para apuntar a las nuevas imágenes.
- No ejecutar cambios destructivos en producción sin confirmación explícita.
- Después de importar, verificar por REST que `main_image_url` y `gallery_urls` devuelven URLs de WordPress Media Library.

### 5.7 Validación posterior

Verificar productos con una y múltiples imágenes:

```text
GET /wp-json/wp/v2/products?slug={slug}&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
```

Resultado esperado:

- `featured_media` no debe ser `0` cuando el producto tenga imagen principal.
- `product_details.main_image` debe contener el ID de la imagen principal.
- `main_image_url` debe devolver una URL de `wp-content/uploads`.
- `product_details.gallery_images` debe contener attachment IDs de las imágenes adicionales.
- `gallery_urls` debe devolver URLs de `wp-content/uploads` en el orden definido.
- Los nombres de archivo en Media Library deben seguir el formato SEO definido.

## 6. Fase 4 — Aplicar migración y subir imágenes por FTP

Esta fase aplica la reconciliación final en WordPress y deja las imágenes de `1 fondo real` importadas en WordPress Media Library. El proceso ya fue probado previamente en local, por lo que debe ejecutarse de forma controlada y verificable, no rediseñarse desde cero.

### 6.1 Conexión FTP HostGator

Usar los datos documentados en los archivos de contexto del proyecto:

```text
Host: ftp.milaprohome.com
Port: 21
Protocol: FTP
User: deploy@milaprohome.com
Password source: .env local, variable FTP_PASSWORD
```

Reglas de seguridad:

- No imprimir la contraseña en consola, logs, reportes ni respuestas.
- No escribir la contraseña en archivos nuevos.
- No subir `.env`.
- No usar la carpeta accidental `/public_html/`.
- Usar siempre el web root real expuesto por esta cuenta FTP: `/`.

Comando base seguro para leer la contraseña desde `.env` en PowerShell:

```powershell
$line = [System.IO.File]::ReadLines((Resolve-Path -LiteralPath ".env")).Where({ $_ -match '^\s*FTP_PASSWORD\s*=' -or $_ -match '^\s*FPT_PASSWORD\s*=' }, 'First') | Select-Object -First 1
$password = ($line -replace '^\s*(FTP_PASSWORD|FPT_PASSWORD)\s*=\s*', '').Trim()
if (($password.StartsWith('"') -and $password.EndsWith('"')) -or ($password.StartsWith("'") -and $password.EndsWith("'"))) { $password = $password.Substring(1, $password.Length - 2) }
```

Verificar acceso FTP:

```powershell
curl.exe --user "deploy@milaprohome.com:$password" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/"
```

### 6.2 Rutas locales y remotas relevantes

WordPress remoto canónico:

```text
/cms/
```

Plugin remoto canónico:

```text
/cms/wp-content/plugins/milapro-headless-cms/
```

Includes remotos del plugin:

```text
/cms/wp-content/plugins/milapro-headless-cms/includes/
```

Uploads remotos de WordPress:

```text
/cms/wp-content/uploads/
```

Ruta local del plugin:

```text
wordpress/plugins/milapro-headless-cms/
```

Ruta local de migraciones:

```text
wordpress/migration/
```

Ruta local canónica de imágenes fondo real:

```text
C:\Users\edmad\Downloads\assets_new\PENDIENTE_FONDO_REAL_CORREGIDO
```

Ruta remota recomendada para subir temporalmente imágenes/migración:

```text
/cms/wp-content/uploads/milapro-fondo-real/
```

Estructura remota recomendada:

```text
/cms/wp-content/uploads/milapro-fondo-real/
  ALUMINIO/
    BAHÍA ESQUINERA/
      1 fondo real/
  OUTLET/
  PLANTAS/
  PLASTICO/
  RATAN/
```

La estructura subida debe preservar categoría, producto y subcarpeta `1 fondo real` para que la migración remota use las mismas reglas que la auditoría local.

### 6.3 Archivos a subir

Subir solo archivos necesarios:

1. Script de migración de imágenes fondo real, si existe:

```text
wordpress/migration/import-fondo-real-images.php
```

Destino recomendado:

```text
/cms/wp-content/uploads/milapro-fondo-real/import-fondo-real-images.php
```

2. Carpeta temporal de imágenes fondo real:

```text
C:\Users\edmad\Downloads\assets_new\PENDIENTE_FONDO_REAL_CORREGIDO
```

Destino recomendado:

```text
/cms/wp-content/uploads/milapro-fondo-real/PENDIENTE_FONDO_REAL_CORREGIDO/
```

3. Si se hicieron cambios en el plugin para soportar la migración, subir únicamente esos archivos modificados:

```text
wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php
wordpress/plugins/milapro-headless-cms/includes/*.php
```

Destino:

```text
/cms/wp-content/plugins/milapro-headless-cms/
/cms/wp-content/plugins/milapro-headless-cms/includes/
```

No subir archivos de contexto `.md`, `.env`, `node_modules`, `dist`, ni archivos no relacionados con esta migración.

### 6.4 Subida FTP recomendada

Para subir un archivo individual:

```powershell
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$password" -T "wordpress\migration\import-fondo-real-images.php" "ftp://ftp.milaprohome.com/cms/wp-content/uploads/milapro-fondo-real/import-fondo-real-images.php"
```

Para subir archivos del plugin modificados:

```powershell
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$password" -T "wordpress\plugins\milapro-headless-cms\milapro-headless-cms.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/milapro-headless-cms.php"
```

Para carpetas completas de imágenes, preferir un cliente FTP/SFTP visual o un script controlado que preserve rutas relativas. Si se usa `curl`, subir archivo por archivo con `--ftp-create-dirs` y destino relativo equivalente.

Antes de subir la carpeta completa, excluir productos eliminados del catálogo canónico:

- `ALUMINIO / MESA VOLGA 2.3`
- `OUTLET / TURKANA`
- `PLANTAS / PALMA ARECA`
- `PLASTICO / Mesa Cala`
- `PLASTICO / MESA LOTO`
- `PLASTICO / SILLETA IRIS`

También excluir productos solo en WordPress que serán borrados:

- `Sillon Anturio`
- `Sillones Narciso`
- `Silla Alta Datura`
- `Silla Alta Narciso`
- `Sillones Casio`

Mantener `ALUMINIO / SILLONES CASPIO` porque corresponde a `aluminio-caspio`.

### 6.5 Ejecución de la migración en producción

La migración debe ejecutarse dentro del contexto de WordPress remoto para que use las APIs nativas de Media Library.

Opciones aceptables:

1. WP-CLI desde cPanel/SSH si está disponible.
2. Herramienta temporal protegida dentro del plugin, solo si no hay WP-CLI.
3. Script temporal ejecutado manualmente desde una ruta protegida, retirándolo o deshabilitándolo después.

No ejecutar un PHP público sin control de acceso.

Si hay WP-CLI, comando conceptual:

```bash
cd /home/.../cms
wp eval-file wp-content/uploads/milapro-fondo-real/import-fondo-real-images.php
```

El script debe recibir o definir la ruta remota base:

```text
/cms/wp-content/uploads/milapro-fondo-real/PENDIENTE_FONDO_REAL_CORREGIDO
```

Acciones que debe realizar:

1. Borrar de WordPress los productos marcados como eliminados o solo en WordPress, si esta ejecución incluye reconciliación.
2. Importar imágenes de productos canónicos desde `1 fondo real`.
3. Renombrar mediante copia temporal con nombre SEO antes de importar.
4. Guardar `_milapro_main_image`.
5. Ejecutar `set_post_thumbnail`.
6. Guardar `_milapro_gallery_images` en orden.
7. Registrar meta de origen para deduplicar.
8. Emitir reporte JSON.

### 6.6 Verificación después de migrar

Verificar REST remoto:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?slug=aluminio-bahia-esquinera&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
https://cms.milaprohome.com/wp-json/wp/v2/products?slug=aluminio-caspio&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
https://cms.milaprohome.com/wp-json/wp/v2/products?slug=plastico-mesa-licerna&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
```

Resultado esperado:

- `featured_media` debe ser distinto de `0`.
- `product_details.main_image` debe ser distinto de `0`.
- `main_image_url` debe apuntar a `https://cms.milaprohome.com/wp-content/uploads/...`.
- `gallery_urls` debe apuntar a `https://cms.milaprohome.com/wp-content/uploads/...` cuando haya imágenes adicionales.
- Las imágenes deben tener nombres SEO basados en categoría/producto.
- `aluminio-caspio` debe usar las imágenes de `ALUMINIO / SILLONES CASPIO / 1 fondo real`.
- `aluminio-sillones-casio` no debe existir si ya se aplicó el borrado canónico.

Verificar conteo remoto:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?per_page=1
```

Revisar header `X-WP-Total`. Después de borrar los 6 productos sin `1 fondo real` y los 5 solo en WordPress, y sin altas nuevas, el total esperado desde el estado auditado es `69` productos publicados.

### 6.7 Alineación local/remoto

Después de producción:

1. Repetir auditoría local contra `http://localhost:8081/wp-json/wp/v2`.
2. Repetir auditoría remota contra `https://cms.milaprohome.com/wp-json/wp/v2`.
3. Confirmar que ambos catálogos tienen los mismos productos canónicos.
4. Confirmar que las imágenes principales y galerías coinciden por producto.
5. Ejecutar el deploy manual desde WordPress cuando los datos estén verificados.

Si local y remoto difieren, no hacer deploy público hasta resolver la diferencia.

## 7. Hallazgos de auditoría local 2026-08-31

Fuente WordPress local: `http://localhost:8081/wp-json/wp/v2`.

Fuente carpetas local: `C:\Users\edmad\Downloads\assets_new\PENDIENTE_FONDO_REAL_CORREGIDO`.

Resumen detectado:

- Categorías locales: `5`
- Productos en carpeta local: `76`
- Productos publicados en WordPress local: `80`
- Matches confirmados: `69`
- Casos que requieren revisión/acción: `12`
- Productos sin subcarpeta `1 fondo real`: `6`
- Productos solo en carpeta: `0`
- Productos solo en WordPress: `5`
- Categorías distintas: `0`
- Coincidencias dudosas: `0` después de confirmación manual

Productos con carpeta local pero sin subcarpeta `1 fondo real`; se consideran eliminados y deben borrarse de WordPress tras confirmación:

- `ALUMINIO / MESA VOLGA 2.3` -> WordPress `Mesa Volga 2.3`
- `OUTLET / TURKANA` -> WordPress `Turkana`
- `PLANTAS / PALMA ARECA` -> WordPress `Palma Areca`
- `PLASTICO / Mesa Cala` -> WordPress `Mesa Cala`
- `PLASTICO / MESA LOTO` -> WordPress `Mesa Loto`
- `PLASTICO / SILLETA IRIS` -> WordPress `Silleta Iris`

Productos solo en WordPress; deben borrarse de WordPress tras confirmación porque no existen como carpeta canónica válida:

- `Plástico / Sillon Anturio` (`plastico-sillon-anturio`)
- `Plástico / Sillones Narciso` (`plastico-sillones-narciso`)
- `Plástico / Silla Alta Datura` (`plastico-silla-alta-datura`)
- `Descuentos | Plástico / Silla Alta Narciso` (`plastico-silla-alta-narciso`)
- `Aluminio | Descuentos / Sillones Casio` (`aluminio-sillones-casio`)

Coincidencia dudosa resuelta por confirmación manual:

- Carpeta `ALUMINIO / SILLONES CASPIO` con `1 fondo real` existe y contiene archivos.
- Corresponde al producto WordPress `Caspio` con slug `aluminio-caspio` y URL pública `/products/aluminio-caspio/`.
- No corresponde a `Sillones Casio` (`aluminio-sillones-casio`).
- Para reconciliación, mantener `Caspio` y usar las imágenes de `ALUMINIO / SILLONES CASPIO / 1 fondo real` para ese producto si se ejecuta la migración de imágenes.
- `Sillones Casio` queda como producto solo en WordPress y debe borrarse tras confirmación de ejecución.

## 8. Ejecución local y producción 2026-08-31

### 8.1 Ajuste canónico de carpeta Caspio

El usuario confirmó que la carpeta duplicada `ALUMINIO / SILLONES CASPIO` debía eliminarse y que el producto canónico es:

```text
ALUMINIO / Caspio -> WordPress aluminio-caspio
```

Acción aplicada localmente:

```text
C:\Users\edmad\Downloads\assets_new\PENDIENTE_FONDO_REAL_CORREGIDO\ALUMINIO\SILLONES CASPIO
```

fue eliminada.

Estado posterior de carpetas locales:

- Productos locales: `75`
- Productos sin `1 fondo real`: `6`
- `ALUMINIO / Caspio / 1 fondo real` existe y queda como fuente canónica para `aluminio-caspio`.

### 8.2 Reconciliación de catálogo local

Tras confirmación del usuario, se borraron en WordPress local Docker los 11 productos no canónicos:

```text
aluminio-mesa-volga-2-3
outlet-turkana
plantas-palma-areca
plastico-mesa-cala
plastico-mesa-loto
plastico-silleta-iris
plastico-sillon-anturio
plastico-sillones-narciso
plastico-silla-alta-datura
plastico-silla-alta-narciso
aluminio-sillones-casio
```

Resultado local verificado por REST:

- `X-WP-Total: 69`
- Los 11 slugs borrados devuelven `[]`.

### 8.3 Migración local de imágenes fondo real

Se creó el script específico:

```text
wordpress/migration/import-fondo-real-images.php
```

También se agregó un mount local de solo lectura para WP-CLI en Docker:

```yaml
- C:/Users/edmad/Downloads/assets_new/PENDIENTE_FONDO_REAL_CORREGIDO:/var/www/html/fondo-real:ro
```

Objetivo del script:

- Recorrer productos locales canónicos.
- Usar `1 fondo real` como fuente de imagen principal.
- Importar imágenes con nombres SEO.
- Guardar `_milapro_main_image`.
- Ejecutar `set_post_thumbnail`.
- Guardar `_milapro_gallery_images` con imágenes adicionales de `1 fondo real`.
- Evitar duplicados usando `_milapro_fondo_real_source_path`, `_milapro_fondo_real_product_slug` y `_milapro_source_path`.

Problemas detectados durante ejecución local:

- La normalización inicial con `iconv` dentro del contenedor perdió letras acentuadas y causó `no_match` para productos como `BAHÍA ESQUINERA`, `MÁLAGA` y `MÁLAGA PETIT`.
- Se corrigió usando `remove_accents()` de WordPress y reemplazos explícitos para vocales acentuadas y `ñ`.

Resultado final local:

- Productos escaneados: `75`
- Productos procesados: `69`
- Productos actualizados: `69`
- Imágenes totales importadas: `80`
- Imágenes fallidas: `0`
- Productos pendientes: `0`
- Productos omitidos: los `6` sin `1 fondo real`

Validación de idempotencia local:

- Segunda pasada: `images_imported: 0`, `images_reused: 80`, `images_failed: 0`.

### 8.4 Migración remota en HostGator

El usuario confirmó ejecutar el flujo controlado en producción.

Se usó FTP con contraseña leída desde `.env`, sin imprimir credenciales.

Ruta remota usada:

```text
/cms/wp-content/uploads/milapro-fondo-real/
```

Archivos subidos temporalmente:

- `import-fondo-real-images.php`
- `run-import-fondo-real-remote.php`
- `80` imágenes válidas dentro de `PENDIENTE_FONDO_REAL_CORREGIDO/**/1 fondo real/` o `1 Fondo real/`

El runner temporal estuvo protegido con un token enviado por header `X-Milapro-Run-Token`, no por URL.

Problemas detectados durante ejecución remota:

- La primera llamada con `curl --fail` reportó HTTP `500`, pero el cuerpo posterior mostró que la migración sí había ejecutado parcialmente.
- HostGator/Linux diferencia mayúsculas y minúsculas. Algunas subcarpetas locales se llamaban `1 Fondo real`, no exactamente `1 fondo real`, por lo que el script las marcó como `missing_fondo_real`.
- Se corrigió el script para detectar la carpeta `1 fondo real` de forma case-insensitive en Linux.

Resultado remoto final:

- Productos escaneados: `69`
- Productos procesados: `69`
- Productos actualizados: `69`
- Imágenes importadas en la última pasada: `8`
- Imágenes reutilizadas en la última pasada: `72`
- Imágenes fallidas: `0`
- Productos pendientes: `0`
- Productos omitidos: `0`
- WordPress remoto quedó con `69` productos.
- Los 11 slugs no canónicos devuelven `[]` por REST.

Después de ejecutar:

- Se eliminó `run-import-fondo-real-remote.php` del servidor.
- Se eliminó `import-fondo-real-images.php` del servidor.
- Ambas URLs verificadas devuelven `404`.

### 8.5 Incidente: galerías anteriores sobrescritas

Después de la migración se detectó un problema funcional:

- Las cards y previews mostraban correctamente la nueva imagen principal desde CMS.
- La página de detalle seguía mostrando imágenes antiguas desde `/productos-mila-web/...` como imagen principal visible.
- Ejemplo afectado:

```text
https://www.milaprohome.com/products/aluminio-caspio/
```

La imagen principal esperada era:

```text
https://cms.milaprohome.com/wp-content/uploads/2026/08/aluminio-caspio-fondo-real.png
```

pero el HTML público seguía usando:

```text
/productos-mila-web/aluminio-caspio/main-01.png
```

Causa raíz en datos:

```php
$gallery = array_map(function (int $attachment_id): array {
    return ['image' => $attachment_id];
}, array_slice($attachment_ids, 1));

update_post_meta($match['post_id'], '_milapro_gallery_images', $gallery);
```

El script de migración reemplazó `_milapro_gallery_images` por solo las imágenes adicionales de `1 fondo real`.

Consecuencia:

- Si `1 fondo real` tenía una sola imagen, la galería quedó vacía.
- Las galerías anteriores dejaron de estar asociadas al producto.
- Los attachments antiguos no fueron borrados de Media Library; solo se perdió temporalmente la relación producto -> galería.

Causa raíz en frontend:

```astro
<ProductGallery images={product.gallery.length ? product.gallery : [product.mainImage]} alt={product.name} />
```

La página de detalle usa `product.gallery` como fuente principal para `ProductGallery`.

Además, en `src/services/productService.ts`, si WordPress devuelve `gallery_urls: []`, el frontend hacía fallback a la galería local estática:

```ts
const wpGallery = firstImageList([uniqueImages(product.gallery_urls ?? []), repeaterGallery], []);
const gallery = wpGallery.length ? wpGallery : firstImageList([localGallery, uniqueImages([localProduct?.mainImage]), uniqueImages([image])]);
```

Por eso el detalle renderizaba rutas antiguas aunque `main_image_url` del CMS fuera correcto.

### 8.6 Recuperación de galerías

Se creó el script:

```text
wordpress/migration/restore-fondo-real-galleries.php
```

Objetivo:

- Leer `wordpress/migration/seed.json`.
- Encontrar cada producto por slug.
- Buscar attachments antiguos por `_milapro_source_path`.
- Reimportar solo si un attachment no existiera.
- Mantener `_milapro_main_image` como la nueva imagen fondo real.
- Restaurar `_milapro_gallery_images` con:
  - imágenes adicionales nuevas de `1 fondo real`, si existen;
  - galería anterior proveniente del seed;
  - sin duplicar el attachment usado como imagen principal.

Resultado local:

- Productos escaneados: `69`
- Productos actualizados: `69`
- Relaciones de galería restauradas: `316`
- Imágenes antiguas reusadas/importadas: `305`
- Imágenes importadas: `0`
- Imágenes fallidas: `0`

Resultado remoto:

- Productos escaneados: `69`
- Productos actualizados: `69`
- Relaciones de galería restauradas: `316`
- Imágenes antiguas reusadas/importadas: `305`
- Imágenes importadas: `0`
- Imágenes fallidas: `0`

Archivos temporales subidos para recuperación remota:

- `restore-fondo-real-galleries.php`
- `run-restore-fondo-real-galleries-remote.php`
- `seed.json`

Después de ejecutar se eliminaron del servidor y se verificó que devuelven `404`.

### 8.7 Fix frontend para detalle de producto

Se modificó:

```text
src/services/productService.ts
```

Cambio aplicado:

```ts
const gallery = wpMainImage
  ? uniqueImages([image, ...wpGallery])
  : firstImageList([localGallery, uniqueImages([localProduct?.mainImage]), uniqueImages([image])]);
```

Nuevo comportamiento:

- Si WordPress tiene `main_image_url`, el detalle construye la galería como `[mainImage, ...wpGallery]`.
- La imagen principal de WordPress siempre queda como primera imagen visible.
- La galería anterior de WordPress queda después.
- El fallback local solo se usa si WordPress no tiene imagen principal.

Validación local de build:

```text
npm run build
npx tsc --noEmit
```

Resultados:

- Build Astro correcto.
- TypeScript correcto.
- El HTML generado para `dist/products/aluminio-caspio/index.html` contiene:

```text
data-gallery-main = https://cms.milaprohome.com/wp-content/uploads/2026/08/aluminio-caspio-fondo-real.png
thumb1 = https://cms.milaprohome.com/wp-content/uploads/2026/08/aluminio-caspio-fondo-real.png
thumb2-5 = galería anterior de WordPress Media Library
```

### 8.8 Deploy del frontend

Se ejecutó `npm run build` y se subieron los HTML generados de `dist/` al FTP root `/`.

La subida completa inicial de `dist/` excedió timeout antes de reportar estado final. Luego se subieron explícitamente los `86` archivos `.html`, todos correctamente:

```text
uploaded: 86
failed: 0
total: 86
```

Verificación pública final:

```text
https://www.milaprohome.com/products/aluminio-caspio/
```

Resultado:

```text
main=https://cms.milaprohome.com/wp-content/uploads/2026/08/aluminio-caspio-fondo-real.png
thumbs=5
thumb1=https://cms.milaprohome.com/wp-content/uploads/2026/08/aluminio-caspio-fondo-real.png
thumb2=https://cms.milaprohome.com/wp-content/uploads/2026/08/main-01-3-1024x1024.png
thumb3=https://cms.milaprohome.com/wp-content/uploads/2026/08/gallery-main-01-1-1024x609.png
thumb4=https://cms.milaprohome.com/wp-content/uploads/2026/08/gallery-real-02-1-1024x585.jpeg
thumb5=https://cms.milaprohome.com/wp-content/uploads/2026/08/gallery-measures-03-1-1024x506.jpg
```

También se verificó:

```text
https://www.milaprohome.com/products/plastico-mesa-licerna/
```

Resultado:

```text
main=https://cms.milaprohome.com/wp-content/uploads/2026/08/plastico-mesa-licerna-fondo-real.png
thumbs=7
```

### 8.9 Estado final verificado

Catálogo:

- WordPress local: `69` productos.
- WordPress remoto: `69` productos.
- Local y remoto tienen los mismos slugs.
- Los productos no canónicos fueron eliminados local y remoto.

Imágenes:

- La imagen principal de cada producto procesado apunta a imagen SEO de fondo real en Media Library.
- Las galerías anteriores fueron recuperadas y siguen asociadas al producto.
- En detalle de producto, la primera imagen renderizada es la imagen principal del CMS.
- Cards, búsqueda/header y detalle consumen imágenes del CMS.

Seguridad:

- No se expusieron contraseñas en logs ni archivos.
- Los runners temporales remotos fueron eliminados.
- Los scripts temporales remotos y `seed.json` temporal fueron eliminados.

Pendiente menor:

- Quedan copias temporales de imágenes fuente bajo `/cms/wp-content/uploads/milapro-fondo-real/PENDIENTE_FONDO_REAL_CORREGIDO/` porque el borrado por FTP respondió `550` para esos archivos.
- No afectan la Media Library ni el frontend público.
- Pueden retirarse manualmente desde cPanel File Manager si se desea limpiar espacio.

Nota de datos:

- Persiste una diferencia no relacionada entre local y remoto:

```text
slug: ratan-madrid
local title: Madrid
remote title: Madrid test
```
