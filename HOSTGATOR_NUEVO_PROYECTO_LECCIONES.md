# Lecciones Para Un Nuevo Proyecto En HostGator

Este documento consolida los problemas encontrados, las soluciones aplicadas y las decisiones tecnicas relevantes para crear un nuevo proyecto con limitaciones parecidas a las de HostGator compartido.

La conclusion principal es: HostGator compartido funciona bien para sitios estaticos, WordPress/PHP/MySQL y deploy por FTP, pero no debe asumirse como un servidor Node.js persistente. Para un proyecto nuevo, la arquitectura mas segura vuelve a ser frontend estatico generado en build + CMS en WordPress/PHP/MySQL, salvo que el plan contratado confirme soporte real para Node.js.

## Stack Que Funciono

- Frontend publico: Astro con salida estatica (`output: 'static'`).
- Build: GitHub Actions ejecutando `npm ci` y `npm run build`.
- Hosting publico: archivos generados en `dist/` subidos por FTP a HostGator.
- CMS: WordPress instalado aparte como headless CMS.
- Backend editable: plugin propio de WordPress en PHP.
- Base de datos: MySQL gestionado por WordPress/HostGator.
- Integracion de contenido: Astro lee la REST API de WordPress durante el build.
- Fallback: datos locales cuando WordPress no esta configurado o no responde.

## Limitaciones Reales Observadas En HostGator

- No se debe depender de un proceso Node.js corriendo en produccion.
- El deploy confiable fue por FTP, no por procesos residentes.
- No hubo SSH/WP-CLI disponible para produccion durante las migraciones documentadas.
- Las operaciones largas en PHP provocaron timeouts o errores `503`/error critico.
- Las importaciones de imagenes fueron el punto mas riesgoso por peso, generacion de thumbnails y limites de tiempo.
- Linux en HostGator diferencia mayusculas/minusculas en rutas.
- Los ZIP creados en Windows pueden generar rutas incompatibles si contienen `\` en vez de `/`.
- FTP puede exponer rutas confusas; en esta cuenta `/` era el web root real y `/public_html/` era una carpeta accidental.
- FTP no siempre elimina carpetas con contenido de forma recursiva; cPanel File Manager puede ser necesario para limpieza.

## Problemas Encontrados

### 1. Rutas incorrectas al subir ZIPs

HostGator interpreto rutas con backslash de Windows como nombres de archivo literales.

Ejemplo incorrecto:

```text
includes\class-seed-validator.php
```

Resultado esperado:

```text
includes/class-seed-validator.php
```

Esto causo errores fatales porque el plugin no encontraba sus archivos internos.

Solucion aplicada:

- Reconstruir ZIPs con separadores `/`.
- Evitar confiar ciegamente en `Compress-Archive` cuando el destino es Linux.
- Verificar el contenido remoto por FTP despues de subir.
- Subir archivos individuales por FTP cuando era mas seguro que subir un ZIP completo.

### 2. Carpeta remota equivocada

Se detecto una carpeta `/public_html/` accidental que no era el web root real para esa cuenta FTP.

Rutas correctas usadas:

```text
Frontend publico: /
WordPress remoto: /cms/
Plugin remoto: /cms/wp-content/plugins/milapro-headless-cms/
Uploads remoto: /cms/wp-content/uploads/
```

Solucion aplicada:

- Usar `/` como destino del frontend estatico.
- Usar `/cms/wp-content/plugins/milapro-headless-cms/` como ruta canonica del plugin.
- No desplegar a `/public_html/`.

### 3. Error fatal por includes faltantes

El plugin fallaba si faltaban archivos internos como:

```text
includes/class-seed-validator.php
includes/class-seed-media-importer.php
includes/class-seed-importer.php
includes/class-seed-import-admin.php
```

Solucion aplicada:

- Hacer que el plugin verifique si los includes son legibles.
- Mostrar aviso admin si una clase requerida no puede cargarse.
- Subir y verificar los includes por FTP.
- Comparar hashes SHA-256 local/remoto cuando fue necesario.

### 4. JavaScript admin roto

La pantalla de importacion se quedaba en:

```text
Cargando herramienta...
```

Tambien hubo un error por salto de linea mal escapado dentro del JavaScript.

Solucion aplicada:

- Imprimir el JavaScript directamente en la pantalla admin del plugin para reducir dependencias de assets externos.
- Corregir el escape de strings y saltos de linea.
- Mantener la UI admin simple y compatible con WordPress/HostGator.

### 5. Timeouts y 503 al importar contenido e imagenes

HostGator compartido no tolero bien importaciones grandes, especialmente con media.

Sintomas observados:

- `503 Service Unavailable`.
- Respuestas HTML de error critico en lugar de JSON AJAX.
- `SyntaxError: Unexpected token '<'` en admin JS porque AJAX esperaba JSON.
- Migraciones ejecutadas parcialmente antes de fallar.

Soluciones aplicadas:

- Importar contenido por lotes pequenos.
- Permitir continuar importaciones interrumpidas.
- Agregar opcion `Importar sin imagenes` para completar primero productos/categorias/reels/blogs.
- Separar migraciones de contenido y migraciones de media.
- Para galerias, cambiar de lotes por cantidad de productos a lotes por presupuesto de imagenes.
- Hacer los scripts idempotentes para poder reintentar sin duplicar adjuntos.

### 6. Falta de SSH/WP-CLI en produccion

Los scripts locales funcionaban con WP-CLI dentro de Docker, pero no podian ejecutarse igual en HostGator.

Solucion aplicada:

- Evitar depender de WP-CLI en produccion.
- Crear herramientas temporales dentro del plugin de WordPress, accesibles desde wp-admin.
- Proteger acciones con `manage_options` y nonce de WordPress.
- Evitar runners PHP publicos sin autenticacion.
- Eliminar herramientas temporales cuando la migracion termina.

### 7. Riesgo de runners temporales tipo webshell

Un runner HTTP suelto protegido por token fue descartado porque el patron se parecia demasiado a un webshell.

Solucion aplicada:

- Portar la logica a una pantalla admin dentro del plugin.
- Usar autenticacion real de WordPress, capability `manage_options` y `check_ajax_referer()`.
- No dejar scripts publicos permanentes.

### 8. Normalizacion de nombres con tildes

`iconv` dentro del contenedor podia perder letras acentuadas y romper coincidencias de productos como `BAHIA`, `MALAGA` o nombres con `ñ`.

Solucion aplicada:

- Usar `remove_accents()` de WordPress.
- Agregar reemplazos explicitos para vocales acentuadas y `ñ`.
- Comparar nombres ignorando mayusculas, acentos, espacios, guiones y caracteres especiales.

### 9. Diferencias de mayusculas/minusculas en Linux

Algunas carpetas eran `1 Fondo real` y otras `1 fondo real`. En Windows esto puede pasar inadvertido, pero en Linux no.

Solucion aplicada:

- Deteccion case-insensitive de carpetas esperadas.
- Reportar variantes sospechosas antes de migrar.
- No asumir automaticamente carpetas ambiguas como equivalentes.

### 10. Galerias sobrescritas por migracion

Durante la migracion de imagen principal desde `1 fondo real`, `_milapro_gallery_images` fue reemplazado y algunos productos quedaron sin galeria anterior asociada.

Causa:

- El script trataba las imagenes adicionales de `1 fondo real` como la nueva galeria completa.
- Si solo habia una imagen en `1 fondo real`, la galeria quedaba vacia.
- El frontend caia a imagenes estaticas antiguas si WordPress devolvia `gallery_urls: []`.

Solucion aplicada:

- Crear script de recuperacion de galerias desde `seed.json`.
- Restaurar relaciones `_milapro_gallery_images` sin borrar attachments antiguos.
- Corregir el frontend para construir la galeria como `[mainImage, ...wpGallery]` cuando WordPress tiene `main_image_url`.
- Usar fallback local solo si WordPress no entrega imagen principal.

### 11. Imagenes estaticas en vez de Media Library

Al inicio, varios productos se veian bien en el frontend porque existian archivos estaticos en Astro, pero WordPress no tenia attachments reales.

Ejemplo de estado incorrecto:

```text
featured_media: 0
product_details.main_image: 0
```

Solucion aplicada:

- Migrar imagenes principales y galerias a WordPress Media Library.
- Guardar IDs de attachment en `_milapro_main_image` y `_milapro_gallery_images`.
- Exponer `main_image_url` y `gallery_urls` desde REST.
- Deduplicar imports con metadatos de origen.

### 12. Demasiados rebuilds automaticos

Guardar productos, reels, categorias o blogs disparaba GitHub Actions demasiadas veces.

Solucion aplicada:

- Desactivar deploy automatico en saves/deletes.
- Mantener un boton manual `Deploy` en pantallas admin relevantes.
- Permitir que el editor haga muchos cambios y dispare un solo rebuild.

## Cambios Tecnicos Aplicados

### Frontend Astro

- Se mantuvo salida estatica en `dist/`.
- Se uso la capa `src/services` para leer WordPress o fallback local.
- Las paginas publicas permanecen estaticas y SEO-friendly.
- El detalle de producto ahora prioriza `main_image_url` de WordPress.
- Las galerias se renderizan con imagen principal primero y luego galeria de WordPress.
- El build no requiere Node.js en HostGator; Node solo corre en GitHub Actions o localmente.

### WordPress Headless

- Se uso WordPress como CMS, no como frontend publico.
- Se creo/adapto un plugin propio `milapro-headless-cms`.
- Se registraron modelos como productos, categorias de producto y reels.
- Se expusieron campos REST calculados para Astro.
- Se agregaron metaboxes nativos para editar productos, galerias, reels e imagenes sin depender obligatoriamente de ACF.
- Se mantuvo uso de Media Library para imagenes editables.

### Migraciones

- El seed inicial importo contenido por lotes.
- Las imagenes pesadas se migraron en fases separadas.
- La imagen principal se migro desde `1 fondo real`.
- Las galerias se migraron desde `2 fondo blanco`, `3 medidas` y `4 variantes`.
- Los scripts fueron idempotentes para reintentos seguros.
- Se validaron conteos, slugs, REST, hashes y builds antes/despues.

### Deploy Manual

- WordPress no publica automaticamente cada cambio.
- El editor modifica contenido en CMS.
- El editor presiona `Deploy`.
- El plugin dispara un repository dispatch a GitHub Actions.
- GitHub Actions construye Astro y sube `dist/` por FTP.

## Flujo FTP Recomendado

No guardar credenciales en documentacion, codigo ni commits. Usar `.env` local o GitHub Secrets.

Variables tipicas:

```env
FTP_HOST=ftp.midominio.com
FTP_USERNAME=usuario-ftp
FTP_PASSWORD=valor-secreto
FTP_TARGET_DIR=/
```

Para WordPress/plugin:

```text
/cms/wp-content/plugins/nombre-del-plugin/
/cms/wp-content/uploads/
```

Para frontend estatico:

```text
/
```

Buenas practicas FTP:

- Confirmar primero cual es el web root real de la cuenta FTP.
- No asumir que `/public_html/` es correcto.
- Subir solo archivos modificados del plugin.
- No subir `.env`, `node_modules`, archivos `.md` ni temporales innecesarios.
- Verificar listados remotos despues de subir.
- Comparar hash local/remoto si el archivo es critico.
- Eliminar runners temporales al finalizar.
- Si FTP falla al borrar carpetas, usar cPanel File Manager.

## Arquitectura Recomendada Para El Nuevo Proyecto

### Opcion recomendada si sera HostGator compartido

```text
Astro static frontend
  -> build en GitHub Actions
  -> deploy de dist por FTP

WordPress CMS en /cms o subdominio cms.midominio.com
  -> plugin PHP propio para modelos y campos
  -> MySQL gestionado por HostGator
  -> REST API publica de solo lectura

GitHub Actions
  -> Node.js solo durante build
  -> FTP upload al hosting
```

Ventajas:

- Compatible con HostGator compartido.
- No requiere proceso Node en produccion.
- Buen rendimiento publico porque el sitio servido es estatico.
- Mejor SEO que una app cliente pura.
- WordPress da panel editable al cliente.
- PHP/MySQL encaja con el entorno natural de cPanel/HostGator.

Costos/riesgos:

- Cada cambio de contenido requiere rebuild/deploy.
- Las migraciones de media deben hacerse con cuidado.
- El plugin PHP propio debe mantenerse.
- Si se requieren funciones dinamicas en tiempo real, hay que resolverlas aparte.

### Cuando considerar PHP + MySQL directo sin WordPress

Puede ser valido si el proyecto nuevo necesita un backend pequeno y completamente custom, por ejemplo formularios, panel simple o CRUD propio.

Ventajas:

- Encaja con HostGator.
- No depende de Node en produccion.
- Menos sobrecarga que WordPress si el CMS es muy simple.

Desventajas:

- Hay que construir autenticacion, panel admin, carga de imagenes, permisos y seguridad.
- Mas responsabilidad tecnica propia.
- Menos conveniente para editores no tecnicos.

### Cuando considerar Node.js

Solo conviene si el plan contratado confirma soporte real para Node.js con procesos persistentes o si el deploy se mueve a otro proveedor.

HostGator compartido, segun lo observado en este proyecto, no debe planearse como si fuera un VPS o un runtime Node moderno.

Node puede usarse con seguridad en:

- Desarrollo local.
- Scripts de build.
- GitHub Actions.
- Generacion estatica de Astro.

Node no debe asumirse para:

- API Express persistente.
- SSR en produccion.
- WebSockets.
- Workers residentes.
- Procesos en segundo plano.
- Colas o cron jobs Node confiables.

Si el nuevo proyecto necesita Node real, las opciones mas sanas son:

- Cambiar a un hosting con soporte Node/VPS.
- Usar Vercel, Netlify, Render, Railway, Fly.io o VPS.
- Mantener HostGator solo como hosting estatico y poner la API en otro servicio.

## Respuesta Clara: Node O PHP/MySQL

Para HostGator compartido, la decision practica es:

- Si el sitio puede ser estatico y el contenido cambia mediante CMS: usar Astro estatico + WordPress/PHP/MySQL.
- Si hace falta backend simple dentro del mismo hosting: usar PHP + MySQL.
- Si hace falta backend moderno en tiempo real, SSR, API Node, sockets o procesos persistentes: no basar el proyecto en HostGator compartido; usar otro hosting o separar frontend/API.

En este proyecto, Node ya se uso correctamente, pero solo fuera de produccion HostGator: localmente y en GitHub Actions. En produccion, lo que quedo en HostGator fueron archivos estaticos, WordPress, PHP, MySQL y uploads.

## Checklist Para Un Nuevo Proyecto En HostGator

Antes de empezar:

1. Confirmar tipo exacto de plan HostGator.
2. Confirmar si hay SSH y WP-CLI.
3. Confirmar si hay soporte Node real o solo PHP/MySQL.
4. Confirmar web root real de la cuenta FTP.
5. Confirmar si `/public_html/` es realmente el destino o si la cuenta FTP ya cae directo en `/`.
6. Definir si el CMS sera WordPress o custom PHP.
7. Definir si el sitio publico puede ser estatico.
8. Definir estrategia de imagenes antes de cargar cientos de archivos.

Durante desarrollo:

1. Mantener frontend desacoplado del origen de datos.
2. Usar servicios para alternar entre CMS y fallback local.
3. No acoplar componentes visuales a WordPress.
4. Probar build estatico desde temprano.
5. Probar rutas y assets desde dominio raiz.
6. Mantener migraciones idempotentes.
7. Validar local antes de tocar produccion.

Durante deploy:

1. Build en GitHub Actions o local.
2. Subir `dist/` por FTP.
3. Subir plugin PHP solo si cambio.
4. No subir secretos ni contexto interno.
5. Validar endpoints REST.
6. Validar paginas publicas.
7. Validar que no queden scripts temporales publicos.

## Recomendacion Final

Para el proximo proyecto en HostGator, partir de esta base:

```text
Astro estatico para el sitio publico
WordPress headless para contenido editable
Plugin PHP propio solo cuando WordPress no cubra el modelo necesario
MySQL via WordPress/HostGator
GitHub Actions para build
FTP para deploy
Node solo en build, no como runtime de produccion
```

Si el alcance exige autenticacion avanzada, carrito, checkout, inventario en tiempo real, dashboards complejos, APIs con mucha logica o procesos en segundo plano, conviene decidirlo antes: o se implementa en PHP/MySQL dentro de HostGator con sus limites, o se cambia de hosting para permitir Node u otro backend moderno.
