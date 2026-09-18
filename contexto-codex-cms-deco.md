# Contexto para Codex: CMS de DECO ABC con Astro, Vercel y Supabase

Quiero implementar un CMS administrativo propio dentro del proyecto existente de **DECO ABC**. Antes de modificar código, inspecciona completamente la estructura, las dependencias, la configuración de Astro, el adaptador de despliegue y la forma actual en que se cargan productos y páginas. Conserva el diseño público existente y reutiliza sus componentes.

## Contexto del proyecto

- El frontend está hecho con **Astro**.
- El proyecto está desplegado actualmente en **Vercel**.
- El catálogo y las páginas ya pueden renderizar contenido a partir de datos estructurados.
- Se quiere reemplazar la información local o estática por datos administrables en **Supabase**.
- El cliente debe poder crear y editar productos y proyectos, administrar sus imágenes y, posiblemente, gestionar ubicaciones.
- El CMS es interno y sencillo; no se busca construir un page builder.
- El layout, los menús, las animaciones y la distribución visual no deben ser editables desde el CMS.
- El sitio público debe conservar buen SEO, especialmente en catálogo y fichas de producto.

## Objetivo
pwd supabase: barbatosfreedo
Crear un área protegida `/admin` que permita administrar el contenido sin editar el repositorio ni disparar manualmente un deployment por cada cambio. Los cambios publicados deben reflejarse en el sitio público mediante consultas a Supabase.

## Arquitectura esperada

- **Astro + adaptador de Vercel** para las rutas que requieran ejecución en servidor.
- **Supabase Postgres** para los datos.
- **Supabase Storage** para imágenes.
- **Supabase Auth** para el acceso administrativo.
- Renderizado del catálogo y las fichas en el servidor cuando ayude al SEO; evitar depender exclusivamente de JavaScript del navegador para el contenido principal.
- Variables sensibles únicamente en el servidor. Nunca exponer `SUPABASE_SERVICE_ROLE_KEY` en código cliente.
- Políticas **RLS**: lectura pública solo de contenido publicado; escritura únicamente para administradores autenticados.

No cambies todo el proyecto a SSR sin justificarlo. Primero determina si conviene usar modo híbrido o rutas puntuales con `prerender = false`, de acuerdo con la versión y configuración actual de Astro.

## Alcance inicial del CMS

### Autenticación

- Inicio y cierre de sesión.
- Sin registro público.
- Acceso limitado a usuarios autorizados.
- Protección real del lado del servidor para `/admin`; no basta con ocultar la interfaz.

### Productos

- Listar, buscar, crear, editar, publicar, despublicar y eliminar.
- Campos mínimos: nombre, slug único, descripción corta, descripción completa, categoría, estado, orden, imagen principal, galería, metadatos SEO y timestamps.
- Permitir añadir, quitar y reordenar imágenes.
- Validar el slug y mostrar un aviso claro si ya existe.
- Confirmar antes de eliminar y evitar dejar archivos huérfanos.

### Categorías

- CRUD básico.
- Nombre, slug, descripción, imagen opcional, orden y estado.
- Evitar eliminar categorías que todavía tengan productos, salvo que exista una reasignación explícita.

### Proyectos o blog de trabajos realizados

- CRUD con título, slug, resumen, contenido, imagen principal, galería, fecha, estado y SEO.
- Estados mínimos: borrador y publicado.

### Ubicaciones

- Preparar un CRUD sencillo si el modelo actual del sitio ya usa ubicaciones.
- Campos tentativos: nombre, dirección, ciudad/estado, coordenadas opcionales, teléfono, horario, enlace de mapa, orden y activo.
- Si aún no existe un uso claro en el frontend, crear primero el modelo y dejar la interfaz desacoplada, sin inventar una sección pública.

## Modelo de datos sugerido

Adapta estos nombres al dominio ya existente si el proyecto tiene una convención definida:

- `profiles`: usuario y rol administrativo.
- `categories`.
- `products`.
- `product_images`: producto, ruta del archivo, texto alternativo, orden y tipo principal/galería.
- `projects`.
- `project_images`: proyecto, ruta, texto alternativo y orden.
- `locations`.

Usa claves foráneas, índices para `slug`, `status`, `category_id` y `sort_order`, y restricciones de unicidad donde correspondan. Genera migraciones SQL versionadas dentro del repositorio; no dependas solamente de cambios manuales en el dashboard.

## Imágenes

- Buckets separados o rutas claramente separadas para productos y proyectos.
- Validar tipo MIME y tamaño.
- Generar nombres únicos y seguros; no usar directamente el nombre original como clave.
- Guardar ruta/clave en la base de datos, no una URL firmada temporal.
- Incluir texto alternativo editable.
- Mostrar progreso, errores y vista previa al subir.
- Comprimir o redimensionar imágenes grandes antes de almacenarlas cuando sea viable.
- Al reemplazar o eliminar una imagen, coordinar base de datos y Storage para reducir archivos huérfanos.

## Experiencia del panel

- Mantener la interfaz simple y coherente con la tecnología visual ya instalada.
- Navegación lateral o superior con Productos, Categorías, Proyectos y Ubicaciones.
- Tablas/listas con búsqueda, filtros por estado y paginación si es necesaria.
- Formularios con validación clara, estado de guardado, errores comprensibles y confirmaciones.
- No agregar una dependencia grande de UI si el proyecto ya tiene componentes suficientes.

## Integración con el sitio público

- Crear una capa de acceso a datos reutilizable; los componentes de presentación no deben consultar Supabase de forma dispersa.
- Sustituir gradualmente la fuente estática actual por repositorios o funciones de consulta.
- Mostrar únicamente registros publicados.
- Resolver rutas por slug y responder con 404 real cuando no exista un registro publicado.
- Mantener título, descripción, canonical, Open Graph, datos estructurados y `alt` de imágenes.
- Definir una estrategia de caché compatible con Vercel. Documentar cuánto tarda en verse un cambio y cómo invalidar caché si aplica.

## Seguridad

- Habilitar RLS en todas las tablas expuestas.
- Lectura anónima solo para filas publicadas y campos públicos.
- Escritura solo para administradores.
- Validar nuevamente en el servidor; no confiar solo en los formularios.
- No incluir secretos en variables con prefijo público.
- Revisar que las políticas de Storage impidan que visitantes suban o borren archivos.
- Preferir borrado lógico o advertencias cuando un registro esté enlazado desde otra parte.

## Forma de trabajo solicitada

1. Inspecciona el repositorio y resume la arquitectura actual.
2. Identifica archivos, rutas y componentes que serán afectados.
3. Propón un plan incremental y señala cualquier decisión que necesite mi confirmación.
4. Implementa primero la base: configuración, cliente Supabase, migraciones, autenticación y protección de `/admin`.
5. Continúa con Categorías y Productos; después Proyectos y finalmente Ubicaciones.
6. Migra o crea un pequeño conjunto de datos de prueba sin borrar la fuente actual hasta validar la nueva.
7. Ejecuta lint, comprobación de tipos, build y pruebas disponibles después de cada bloque importante.
8. Documenta variables de entorno, creación del primer administrador, ejecución de migraciones y flujo de despliegue.

No alteres la apariencia pública sin necesidad. No elimines datos o archivos existentes. Si encuentras cambios no relacionados en el repositorio, consérvalos.

## Entregables

- Migraciones SQL y políticas RLS.
- Integración de Supabase en Astro.
- Login y rutas administrativas protegidas.
- CRUD funcional para el alcance acordado.
- Carga y administración de imágenes.
- Sitio público consumiendo contenido publicado.
- Archivo `.env.example` sin secretos.
- Documentación de instalación, variables, migraciones, creación de administrador y despliegue en Vercel.
- Resumen final de archivos modificados, decisiones tomadas, pruebas ejecutadas y pendientes.

## Criterios de aceptación del MVP

- Un administrador autorizado puede iniciar sesión.
- Puede crear una categoría y un producto con imagen principal y galería.
- Puede dejar el producto como borrador o publicarlo.
- Un producto publicado aparece en el catálogo y su URL por slug funciona.
- Un borrador no es visible públicamente.
- La ficha conserva SEO y responde 404 cuando corresponde.
- Ningún visitante puede escribir en la base de datos ni en Storage.
- El proyecto compila y se despliega correctamente en Vercel.

Comienza inspeccionando el repositorio. No implementes supuestos irreversibles: si la estructura real contradice este documento, explica el conflicto y adapta el plan antes de continuar.
