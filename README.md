# Revelo Catalog MVP

Visual MVP de catálogo comercial inspirado en el PDF de referencia de Milapro Home. El proyecto usa Astro, TypeScript, Tailwind CSS, datos mock locales y salida estática para HostGator.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Estructura

```text
src/
  components/
    common/
    navigation/
    product/
    category/
    filters/
    sections/
  data/
  layouts/
  pages/
  services/
  styles/
  types/
```

## Páginas Implementadas

- `/` home comercial con hero, beneficios, categorías, productos, social proof, blogs, reviews y CTA.
- `/products/` catálogo con búsqueda y filtros locales visuales.
- `/products/[slug]/` detalle estático por producto con galería, colores, especificaciones y relacionados.
- `/categories/[slug]/` categorías estáticas con productos y categorías relacionadas.
- `/about/` historia y valores de marca.
- `/contact/` formulario visual con validación local, sin envío real.
- `/404.html` página de error personalizada.

## WordPress Headless

El proyecto ahora está preparado para usar WordPress como CMS headless sin cambiar el frontend visual aprobado. El flujo es:

```text
WordPress REST API -> src/services -> src/pages -> components via props
```

Si `WORDPRESS_API_URL` no está configurada o WordPress no responde, los servicios usan los datos locales de `src/data` como fallback para no romper el build.

La estructura CMS vive en el plugin propio `wordpress/plugins/milapro-headless-cms` y el entorno local usa Docker:

```bash
docker compose up -d
```

Documentación completa: `docs/wordpress-headless.md`.

## Despliegue HostGator

1. WordPress se instala en HostGator como CMS, preferentemente en `cms.example.com`.
2. GitHub Actions ejecuta `npm run build` leyendo la REST API de WordPress.
3. GitHub Actions sube `dist/` a HostGator por FTP.
4. El plugin de WordPress dispara el workflow cuando se actualizan productos, categorías, reels o blogs.
5. No se requiere proceso Node.js en producción.

## Diferido Intencionalmente

- Backend, base de datos y autenticación.
- WooCommerce, carrito, checkout, pagos y órdenes.
- Envío real del formulario de contacto.
- Persistencia de favoritos o analítica.
- Filtrado avanzado conectado a inventario real.

## Validación

- `npm run build` genera `dist/` con salida estática.
- `npx tsc --noEmit` valida TypeScript sin errores.
