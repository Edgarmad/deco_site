# Contexto del proyecto Deco

Fecha de creacion: 2026-09-07

## Objetivo

Construir una pagina para Deco usando como referencia tecnica el proyecto anterior documentado en los archivos `.md` de la raiz: frontend publico en Astro, CMS editable en WordPress y despliegue estatico hacia hosting compartido.

Este archivo debe usarse como contexto inicial para futuras tareas del proyecto Deco.

## Evidencia revisada

Archivos Markdown de raiz revisados:

- `README.md`
- `wordpress-headless.md`
- `HOSTGATOR_DEPLOY_CONTEXT.md`
- `HOSTGATOR_FTP_CONTEXT.md`
- `HOSTGATOR_NUEVO_PROYECTO_LECCIONES.md`
- `PLUGIN_CHANGE_CONTEXT.md`
- `WP_MEDIA_LIBRARY_MIGRATION_CONTEXT.md`
- `productos-mila-web-migration-context.md`
- `prompt_auditoria_fondo_real.md`
- `prompt_auditoria_galerias.md`

La informacion especifica de MilaPro, credenciales, dominios, rutas FTP y nombres de plugin anteriores no deben asumirse validos para Deco. Solo sirven como evidencia de arquitectura, riesgos y flujo de trabajo.

## Arquitectura recomendada

Para un hosting compartido tipo HostGator, la arquitectura recomendada para Deco es:

```text
Astro static frontend
  -> build local o GitHub Actions
  -> genera dist/
  -> deploy por FTP al hosting publico

WordPress headless CMS
  -> instalado en /cms o subdominio cms.dominio.com
  -> contenido editable por el cliente
  -> REST API publica de solo lectura para el build

Plugin WordPress propio
  -> modelos, campos, Media Library y endpoints REST necesarios
  -> deploy manual para disparar rebuild cuando el editor termine cambios
```

Decision clave: no depender de Node.js corriendo en produccion si el hosting es compartido. Node debe usarse solo en desarrollo, scripts y build.

## Stack base

- Frontend publico: Astro con `output: 'static'`.
- Estilos: preservar el sistema visual que se defina para Deco.
- Datos: capa `src/services` para leer WordPress durante build.
- Fallback: datos locales cuando WordPress no este configurado o no responda.
- CMS: WordPress headless.
- Backend editable: plugin PHP propio si WordPress no cubre el modelo necesario.
- Imagenes editables: WordPress Media Library, no rutas estaticas como fuente principal final.
- Deploy: GitHub Actions o build local + FTP de `dist/`.

## Buenas practicas obligatorias

El proyecto Deco debe priorizar buenas practicas de programacion para que el sitio sea facil de entender, mantener, escalar y modificar a futuro. Cualquier cambio nuevo debe buscar la solucion mas simple que cumpla el objetivo sin crear deuda tecnica innecesaria.

Buenas practicas que deben seguirse explicitamente:

- Mantener separacion clara de responsabilidades: paginas para composicion, componentes para UI, `src/services` para datos externos y utilidades solo para logica reusable.
- Evitar mezclar detalles de WordPress dentro de componentes visuales; normalizar datos en servicios antes de pasarlos al UI.
- Usar nombres descriptivos y consistentes para archivos, funciones, tipos, variables, custom post types, metadatos y endpoints.
- Preferir componentes pequenos y enfocados cuando una vista crezca demasiado, sin fragmentar de forma innecesaria.
- Evitar duplicacion de codigo; extraer logica comun solo cuando exista una repeticion real o una necesidad clara de reutilizacion.
- Mantener tipado estricto cuando se use TypeScript; evitar `any` salvo justificacion puntual y documentada.
- Validar y sanear datos provenientes de WordPress antes de renderizarlos o usarlos en el build.
- Manejar estados de error, datos vacios y fallbacks de forma explicita para que el sitio no falle silenciosamente.
- No hardcodear credenciales, dominios definitivos, rutas FTP, tokens ni configuraciones sensibles en codigo versionable.
- Usar variables de entorno y secrets para configuracion dependiente del ambiente.
- Escribir codigo idempotente para migraciones, imports y scripts que puedan necesitar reintentos.
- Mantener compatibilidad con hosting compartido: no depender de procesos Node persistentes, SSH o WP-CLI en produccion.
- Documentar decisiones tecnicas importantes cuando afecten arquitectura, datos, deploy o mantenimiento futuro.
- Agregar comentarios solo cuando expliquen una decision no obvia; evitar comentarios que repitan literalmente el codigo.
- Cuidar accesibilidad basica: HTML semantico, textos alternativos en imagenes relevantes, labels en formularios y navegacion usable por teclado.
- Cuidar performance: generar sitio estatico, optimizar imagenes, evitar JavaScript innecesario en el cliente y no cargar dependencias pesadas sin necesidad.
- Cuidar SEO tecnico: titulos, descripciones, URLs claras, headings ordenados, metadatos sociales y contenido indexable.
- Mantener estilos escalables y coherentes con el sistema visual de Deco; evitar CSS duplicado, selectores fragiles o soluciones visuales dificiles de mantener.
- Documentar la estructura de archivos editables con comentarios breves. En archivos `.astro`, cada seccion principal debe tener un comentario con su nombre antes del bloque correspondiente, por ejemplo `<!-- Seccion: Hero -->`, para facilitar modificaciones directas por cualquier persona.
- Probar cambios importantes con `npm run build` y, cuando aplique, `npx tsc --noEmit` antes de considerarlos listos.
- No hacer cambios destructivos en contenido, media, base de datos, FTP o Git sin confirmacion explicita del usuario.

## Flujo de contenido

1. El editor modifica contenido en WordPress.
2. WordPress guarda campos, imagenes y relaciones en post meta, term meta u options.
3. El editor presiona un boton manual `Deploy`.
4. El plugin dispara un repository dispatch de GitHub Actions.
5. GitHub Actions ejecuta `npm ci` y `npm run build`.
6. Astro consume la REST API de WordPress durante el build.
7. El workflow sube `dist/` por FTP al hosting.
8. La pagina publica queda estatica, rapida y SEO-friendly.

Evitar deploy automatico en cada guardado para no disparar demasiados workflows mientras se editan varios contenidos.

## Variables esperadas

Configurar como variables locales o GitHub Secrets, nunca dentro del codigo ni documentacion con valores reales:

```env
WORDPRESS_API_URL=https://cms.dominio-deco.com/wp-json/wp/v2
WORDPRESS_SITE_URL=https://cms.dominio-deco.com
WORDPRESS_API_TIMEOUT_MS=8000
FTP_HOST=ftp.dominio-deco.com
FTP_USERNAME=usuario-ftp
FTP_PASSWORD=valor-secreto
FTP_TARGET_DIR=/
```

Si se usa deploy manual desde WordPress hacia GitHub Actions:

```php
define('DECO_REBUILD_WEBHOOK_URL', 'https://api.github.com/repos/OWNER/REPO/dispatches');
define('DECO_REBUILD_WEBHOOK_SECRET', 'github-token-here');
```

Los nombres de constantes pueden cambiar cuando se cree el plugin real, pero deben evitar mezclar prefijos del proyecto anterior.

## Modelos posibles en WordPress

Definir segun el alcance real de Deco, pero el proyecto anterior prueba que funciona bien este patron:

- Custom post types para entidades editables principales.
- Taxonomias para categorias cuando haya catalogo.
- Metaboxes nativos para campos fijos.
- ACF opcional, no obligatorio.
- REST fields calculados para simplificar el consumo desde Astro.
- Imagenes guardadas como attachment IDs y expuestas como URLs listas para frontend.

Si Deco necesita catalogo/productos, usar un modelo parecido:

```text
products custom post type
product_category taxonomy
_deco_main_image
_deco_gallery_images
main_image_url
gallery_urls
product_details
```

Si Deco necesita banners/home editable, preferir options fijas o un CPT pequeno con slots concretos, no un page builder generico.

## Reglas para imagenes

- La Media Library de WordPress debe ser la fuente final de imagenes editables.
- Astro puede tener imagenes locales como fallback temporal, pero no deben ocultar problemas permanentes del CMS.
- Guardar attachment IDs en WordPress y exponer URLs por REST.
- Mantener orden de galerias desde el CMS.
- Hacer migraciones de imagenes por lotes pequenos.
- Importar media de forma idempotente usando metadatos de origen para evitar duplicados.
- Usar nombres SEO para archivos importados cuando haya migracion masiva.
- No borrar attachments antiguos durante la primera migracion salvo confirmacion explicita.

## Lecciones criticas de HostGator/hosting compartido

- No asumir Node.js persistente en produccion.
- No asumir SSH ni WP-CLI disponibles en produccion.
- Confirmar el web root real antes de subir `dist/`.
- No asumir que `/public_html/` siempre es el destino correcto.
- Linux distingue mayusculas/minusculas en rutas.
- ZIPs generados en Windows pueden contener `\` y romper rutas al extraer en Linux.
- Las importaciones grandes de imagenes pueden causar `503`, timeouts o respuestas HTML donde se esperaba JSON.
- FTP puede no borrar carpetas con contenido de forma recursiva; cPanel File Manager puede ser necesario.
- Las herramientas temporales de migracion deben estar dentro de wp-admin o protegidas correctamente y eliminarse al terminar.

## Reglas de migracion

Antes de cualquier migracion de contenido o media:

1. Auditar primero sin modificar datos.
2. Comparar fuente local, WordPress local y WordPress remoto si aplica.
3. Generar reporte de matches, pendientes, omitidos y dudosos.
4. Esperar confirmacion del usuario antes de acciones destructivas.
5. Probar en WordPress local Docker antes de produccion si existe entorno local.
6. Hacer scripts idempotentes para poder reintentar.
7. Validar REST despues de cada ejecucion.
8. Ejecutar build Astro despues de validar datos CMS.

No recrear, borrar o reasignar productos/contenidos solo por coincidencias parciales sin confirmacion cuando haya ambiguedad.

## Patron de frontend

La capa de servicios debe aislar WordPress del UI:

```text
WordPress REST API -> src/services -> pages/loaders -> components via props
```

Los componentes visuales no deben conocer detalles internos de WordPress como `_embedded`, IDs de attachment o post meta. El servicio debe normalizar la respuesta a tipos propios de Deco.

Fallback recomendado:

```text
Si WORDPRESS_API_URL existe y WordPress responde:
  usar datos del CMS
  usar imagenes CMS primero
  usar fallback local solo como emergencia transicional

Si WordPress no responde o no esta configurado:
  usar datos locales para no romper el build
```

## Patron de plugin WordPress

Cuando se cree el plugin de Deco:

- Usar prefijo propio (`deco_`, `_deco_`, `Deco_*`).
- No reutilizar nombres `milapro` salvo que se este migrando codigo y se renombre correctamente.
- Registrar modelos en `init`.
- Usar metaboxes nativos para campos fijos.
- Usar Media Library para imagenes.
- Guardar con nonces y capability checks.
- Exponer REST fields simples para Astro.
- Mantener deploy manual con nonce y permisos.
- No mostrar tokens ni secretos en UI, logs o respuestas.

## Validaciones recomendadas

Durante desarrollo:

```bash
npm run build
npx tsc --noEmit
```

Para WordPress local si existe Docker:

```powershell
docker compose up -d
docker compose ps
```

Verificar endpoints REST esperados cuando el CMS este listo:

```text
https://cms.dominio-deco.com/wp-json/wp/v2
```

Agregar endpoints concretos cuando se definan los modelos reales de Deco.

## Pendientes de definicion para Deco

- Dominio publico final.
- Dominio o ruta del CMS.
- Hosting real y web root FTP.
- Si habra catalogo, blog, banners, galerias, reels u otros tipos de contenido.
- Campos exactos editables por el cliente.
- Estrategia de imagenes iniciales y migracion.
- Si se requiere Docker local para WordPress.
- Nombre final del plugin WordPress.
- Workflow GitHub Actions y secrets reales.

## Criterio de exito

El proyecto Deco debe quedar con:

- Sitio publico Astro estatico.
- Contenido editable en WordPress.
- Imagenes administrables desde Media Library.
- Build reproducible localmente y en GitHub Actions.
- Deploy FTP controlado.
- Boton manual de deploy desde WordPress si el cliente editara contenido con frecuencia.
- Fallback local suficiente para desarrollo, sin ocultar errores del CMS en produccion.
- Sin credenciales ni tokens escritos en archivos versionables.
