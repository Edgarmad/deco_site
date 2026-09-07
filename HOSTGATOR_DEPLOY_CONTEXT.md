# Contexto Para Guiarme Con ChatGPT: Deploy En HostGator

Quiero desplegar un sitio web estático hecho con Astro en HostGator.

## Proyecto

- Nombre del proyecto: `revelo-catalog-mvp`
- Framework: Astro
- Build command: `npm run build`
- Output generado: `dist/`
- El sitio está configurado como estático con `output: 'static'` en `astro.config.mjs`.
- No necesito correr Node.js en HostGator.
- El contenido de `dist/` debe subirse a la raíz FTP `/`, porque en esta cuenta `/` ya corresponde al directorio público real del hosting.
- No usar `/public_html/`: esa carpeta fue creada por error el 23 de agosto o después y no es el web root real.

## CMS

- El sitio puede usar WordPress como CMS headless.
- WordPress debería instalarse preferentemente en un subdominio como `cms.midominio.com`.
- El frontend público queda en el dominio principal, por ejemplo `midominio.com`.
- Astro lee contenido desde la REST API de WordPress durante el build.
- Si WordPress no está configurado o no responde, el proyecto tiene fallback local para no romper el build.

## Variables Necesarias

Estas variables se configuran como GitHub Secrets, no directamente dentro del código:

```env
WORDPRESS_API_URL=https://cms.midominio.com/wp-json/wp/v2
WORDPRESS_SITE_URL=https://cms.midominio.com
WORDPRESS_API_TIMEOUT_MS=8000
FTP_HOST=ftp.midominio.com
FTP_USERNAME=usuario-ftp
FTP_PASSWORD=password-ftp
FTP_TARGET_DIR=/
```

No debo compartir contraseñas ni tokens en el chat. Si necesito usarlos, debo pegarlos directamente en GitHub Secrets, HostGator o cPanel.

## GitHub Actions

El proyecto ya tiene un workflow en:

```text
.github/workflows/deploy-hostgator.yml
```

Ese workflow hace lo siguiente:

1. Descarga el repositorio.
2. Instala Node.js 20.
3. Ejecuta `npm ci`.
4. Ejecuta `npm run build`.
5. Sube el contenido de `dist/` a HostGator por FTP usando los GitHub Secrets.

## Lo Que Necesito Hacer En HostGator

1. Entrar a cPanel.
2. Confirmar que el dominio principal apunta correctamente al hosting.
3. Activar SSL para el dominio principal.
4. Crear o confirmar una cuenta FTP.
5. Confirmar el directorio destino del sitio público. Para esta cuenta FTP debe ser `/`.
6. Si usaré WordPress como CMS, instalar WordPress en `cms.midominio.com`.
7. Activar SSL también para el subdominio del CMS.

## Lo Que Necesito Hacer En GitHub

1. Ir al repositorio del proyecto.
2. Entrar a `Settings > Secrets and variables > Actions`.
3. Crear los secrets necesarios:
   - `WORDPRESS_API_URL`
   - `WORDPRESS_SITE_URL`
   - `WORDPRESS_API_TIMEOUT_MS`
   - `FTP_HOST`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`
   - `FTP_TARGET_DIR`
4. Ir a `Actions`.
5. Ejecutar manualmente el workflow `Build and Deploy to HostGator`.
6. Revisar los logs si falla.

## Rebuild Automático Desde WordPress

Más adelante quiero que WordPress dispare un rebuild automático cuando cambie contenido.

Para eso necesito:

- Crear un GitHub fine-grained token con permisos para disparar repository dispatch events.
- Configurar WordPress con:

```php
define('MILAPRO_REBUILD_WEBHOOK_URL', 'https://api.github.com/repos/OWNER/REPO/dispatches');
define('MILAPRO_REBUILD_WEBHOOK_SECRET', 'github-token-here');
```

Debo reemplazar `OWNER` y `REPO` por los datos reales del repositorio.

## Objetivo

Quiero que me guíes paso a paso para desplegar el proyecto en HostGator, empezando por revisar qué datos necesito obtener de cPanel y luego cómo configurar GitHub Secrets y ejecutar el workflow.

Por favor, hazme una pregunta a la vez y no me pidas pegar contraseñas, tokens ni credenciales sensibles en el chat.

---

## Estado Actual Actualizado

El frontend Astro ya está publicado en:

```text
https://milaprohome.com
https://www.milaprohome.com
```

El CMS WordPress headless ya está instalado en:

```text
https://cms.milaprohome.com
```

Los enlaces permanentes de WordPress están configurados como:

```text
Nombre de la entrada
```

El plugin propio `Milapro Headless CMS` ya fue adaptado para HostGator compartido.

## Problemas Que Ya Se Resolvieron

Durante la instalación del plugin en HostGator aparecieron varios problemas:

1. WordPress instalaba ZIPs con carpetas anidadas incorrectamente.
2. HostGator interpretaba rutas Windows con `\` como nombres de archivo, por ejemplo:

```text
includes\class-seed-validator.php
```

en vez de crear una carpeta real:

```text
includes/class-seed-validator.php
```

3. El plugin daba error fatal porque no encontraba:

```text
includes/class-seed-validator.php
```

4. El JavaScript de la pantalla admin no cargaba y se quedaba en:

```text
Cargando herramienta...
```

5. Luego hubo un error JavaScript por un salto de línea mal escapado.
6. Finalmente HostGator daba `503 Service Unavailable` durante la importación por carga/timeout.

Todo eso se fue corrigiendo en distintas versiones del ZIP.

## ZIP Final Usado Para Completar La Importación

El ZIP final que permitió completar la importación fue:

```text
milapro-hostgator-content-only.zip
```

Ese plugin:

- Tiene rutas ZIP compatibles con HostGator/Linux.
- Carga correctamente la carpeta `includes/`.
- Imprime el JavaScript directamente en la pantalla admin.
- Importa por lotes pequeños.
- Tiene opción para importar sin imágenes.
- Evita disparar rebuilds durante la importación.
- Evita error fatal si faltan archivos internos, mostrando aviso admin en su lugar.

## Importación De Contenido

La migración de contenido ya se completó desde:

```text
Herramientas > Importar catálogo MilaPro
```

Se completó usando la opción:

```text
Importar sin imágenes por ahora, recomendado para HostGator compartido
```

Esto significa que ya deberían existir en WordPress:

- Categorías de producto
- Productos
- Reels
- Posts/blog

Pero las imágenes destacadas, galerías e imágenes de categorías pueden estar incompletas o vacías porque se omitió la importación de imágenes para evitar errores `503` en HostGator compartido.

## Endpoints A Verificar

Verificar que estos endpoints respondan:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?per_page=5
https://cms.milaprohome.com/wp-json/wp/v2/product_category?hide_empty=false
https://cms.milaprohome.com/wp-json/wp/v2/reels?per_page=5
https://cms.milaprohome.com/wp-json/wp/v2/posts?per_page=5
```

También verificar endpoints con `_embed` porque el frontend los usa:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?_embed
https://cms.milaprohome.com/wp-json/wp/v2/products?slug=aluminio-bahia-esquinera&_embed
https://cms.milaprohome.com/wp-json/wp/v2/product_category?hide_empty=false
https://cms.milaprohome.com/wp-json/wp/v2/reels
https://cms.milaprohome.com/wp-json/wp/v2/posts?_embed
```

## Variables Para Build Del Frontend

Para que Astro consuma el CMS real durante el build, configurar estas variables en GitHub Secrets o en el entorno de build:

```env
WORDPRESS_API_URL=https://cms.milaprohome.com/wp-json/wp/v2
WORDPRESS_SITE_URL=https://cms.milaprohome.com
WORDPRESS_API_TIMEOUT_MS=8000
```

Si se usa GitHub Actions para desplegar a HostGator, también hacen falta:

```env
FTP_HOST=...
FTP_USERNAME=...
FTP_PASSWORD=...
FTP_TARGET_DIR=/
```

No compartir credenciales en el chat.

## Próximo Paso Recomendado

El siguiente paso es verificar los endpoints del CMS y luego reconstruir/deployar el frontend Astro usando el CMS real.

Flujo recomendado:

1. Abrir los endpoints REST y confirmar que devuelven contenido.
2. Configurar variables `WORDPRESS_API_URL` y `WORDPRESS_SITE_URL` en GitHub Actions o entorno local.
3. Ejecutar:

```bash
npm run build
```

4. Revisar que el build tome datos del CMS y no del fallback local.
5. Subir el nuevo `dist/` a HostGator o ejecutar GitHub Actions si ya están configurados los secrets FTP.
6. Revisar el sitio público en:

```text
https://milaprohome.com
```

## Tema Pendiente: Imágenes

La importación se completó sin imágenes para evitar `503`.

Opciones para resolver imágenes después:

1. Dejar que el frontend siga usando imágenes estáticas desde `milaprohome.com` si el frontend ya las tiene en `dist`.
2. Hacer una segunda importación de imágenes en lotes aún más pequeños.
3. Subir assets directamente al servidor y adaptar el importador para usar archivos locales en vez de descargar imágenes remotas.
4. Importar manualmente solo imágenes principales de productos destacados/categorías.

Prioridad recomendada: primero verificar que el sitio público funcione con contenido CMS; después resolver imágenes si faltan visualmente.

## Instrucción Para ChatGPT

Quiero continuar desde este estado. Por favor guíame paso a paso para:

1. Verificar que los endpoints REST del CMS están bien.
2. Confirmar que el frontend Astro puede construir usando `https://cms.milaprohome.com/wp-json/wp/v2`.
3. Deployar el nuevo `dist/` a HostGator.
4. Revisar si las imágenes faltantes afectan el sitio público.
5. Planear la segunda fase de importación de imágenes si es necesaria.

Hazme una pregunta a la vez y no me pidas pegar credenciales, tokens ni contraseñas en el chat.
