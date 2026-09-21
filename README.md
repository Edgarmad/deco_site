# DECO ABC — sitio y CMS

Frontend Astro 7 + TypeScript, desplegado con el adaptador de Vercel (Node 24). Supabase proporciona Postgres, Auth y Storage. La documentación antigua de WordPress/HostGator se conserva como referencia histórica; no describe la arquitectura actual.

## Desarrollo

```bash
npm install
npm run dev
npx astro check
npm test
npm run build
```

Configurar `.env` y Vercel con `SUPABASE_URL` y `SUPABASE_ANON_KEY` según `.env.example`. La clave `SUPABASE_SERVICE_ROLE_KEY` se reserva a scripts controlados; el CMS usa la sesión del administrador y RLS.

## Flujo de contenido

```text
/admin → Supabase Auth + RLS → Postgres / Storage
                                    ↓
                     servicios → páginas SSR → sitio público
```

Las páginas públicas consultan Supabase en cada petición, sin caché HTML: guardar un contenido publicado se refleja al recargar, sin otro deployment. Productos y proyectos vacíos permanecen vacíos. Ubicaciones conserva el respaldo local introducido posteriormente cuando no hay sucursales publicadas. Sin configuración Supabase se conserva el fallback local histórico.

El inventario vigente procede del Excel (160 combinaciones únicas). El catálogo y el admin agrupan por familia/subcategoría, con ficha propia por acabado/color. El panel ofrece datos guiados de calculadora y PDF compartidos por familia. Ver `docs/product-admin.md`.

Rutas públicas: `/`, `/productos`, `/productos/[slug]`, `/proyectos`, `/proyectos/[slug]`, `/ubicaciones`, `/contacto`, `/busqueda`.

Rutas privadas: `/admin/login`, `/admin`, `/admin/productos`, `/admin/categorias`, `/admin/familias`, `/admin/variantes`, `/admin/proyectos`, `/admin/ubicaciones`, `/admin/configuracion`.

## Base de datos y primer administrador

```bash
npm run supabase:push
```

Crear la cuenta en Supabase Auth y asignar `profiles.role = 'admin'`. No existe registro público. Instrucciones SQL en [SUPABASE_CMS.md](SUPABASE_CMS.md).

No ejecutar los scripts de seed sobre contenido editado sin revisar primero sus `upsert`.

## Documentación vigente

- [Operación del panel y verificaciones](docs/admin-cms.md).
- [Configuración Supabase y migraciones](SUPABASE_CMS.md).
- [Datos técnicos y visibilidad de productos](docs/product-admin.md).

## Organización

- `src/pages/admin/[...path].astro`: listados/formularios de contenido y operaciones autenticadas.
- `src/lib/adminContent.ts`: modelos de formulario y validación de servidor.
- `src/lib/adminMedia.ts`: WebP, Storage y limpieza reintentable.
- `src/lib/adminAuth.ts`, `supabaseServer.ts`, `adminSecurity.ts`, `src/middleware.ts`: sesiones y protección.
- `src/services/`: consultas y normalización del contenido público.
- `supabase/migrations/`: estructura, políticas y evolución de la base.
