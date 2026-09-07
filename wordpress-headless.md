# WordPress Headless CMS

This project keeps Astro as the public frontend and uses WordPress only as a CMS.

## Local WordPress

Start WordPress and MySQL locally:

```bash
docker compose up -d
```

Open WordPress at:

```text
http://localhost:8080
```

Complete the normal WordPress installer in the browser, then activate:

- Milapro Headless CMS, already mounted from `wordpress/plugins/milapro-headless-cms`

Advanced Custom Fields is no longer required for the editable product/category/reel fields. The custom plugin provides native WordPress metaboxes for gallery images, colors, variants, specifications, prices and reel data.

Local frontend environment:

```env
WORDPRESS_API_URL=http://localhost:8080/wp-json/wp/v2
WORDPRESS_SITE_URL=http://localhost:8080
WORDPRESS_API_TIMEOUT_MS=8000
```

If `WORDPRESS_API_URL` is missing or WordPress is unavailable, the Astro build falls back to the current local data.

## WordPress Models

The custom plugin registers:

- `products` custom post type for products.
- `product_category` taxonomy for product categories.
- `reels` custom post type for Instagram/TikTok/YouTube reels.

WordPress standard posts are used for blogs.

## Client Editing Scope

The client can edit:

- Product name, slug, descriptions, featured image, gallery, categories, variants, colors, prices and availability.
- Category name, description and image.
- Reels: title, URL, cover image, platform, order and visibility.
- Blog posts.

The approved general site imagery and visual layout remain in Astro code.

## Local Content Migration

The current hardcoded catalog can be migrated into the local Docker WordPress instance with:

```bash
npm run wp:seed
```

This command:

- Builds `wordpress/migration/seed.json` from the existing frontend data.
- Imports product categories, products, reels and blogs through WP-CLI.
- Uploads current product/category/reel/blog images as WordPress media attachments.
- Updates existing content by slug, so it can be safely repeated during local tests.

Individual steps are also available:

```bash
npm run wp:seed:build
npm run wp:seed:import
```

Current migrated baseline:

- 6 product categories.
- 82 products.
- 9 reels.
- 3 blog posts.

The default WordPress `hello-world` post may still exist locally, but the Astro blog service ignores it.

## HostGator Production Flow

HostGator remains the final public hosting. The recommended production flow is:

1. WordPress runs in HostGator, preferably at `cms.example.com`.
2. The Astro frontend is built by GitHub Actions.
3. GitHub Actions uploads `dist/` to HostGator by FTP.
4. The WordPress plugin triggers GitHub Actions whenever products, categories, reels or blogs change.

Required GitHub repository secrets:

```env
WORDPRESS_API_URL=https://cms.example.com/wp-json/wp/v2
WORDPRESS_SITE_URL=https://cms.example.com
WORDPRESS_API_TIMEOUT_MS=8000
FTP_HOST=ftp.example.com
FTP_USERNAME=hostgator-ftp-user
FTP_PASSWORD=hostgator-ftp-password
FTP_TARGET_DIR=/
```

To let WordPress trigger the workflow, create a GitHub fine-grained token with access to dispatch repository events, then configure WordPress with:

```php
define('MILAPRO_REBUILD_WEBHOOK_URL', 'https://api.github.com/repos/OWNER/REPO/dispatches');
define('MILAPRO_REBUILD_WEBHOOK_SECRET', 'github-token-here');
```

For local Docker, the same values can be provided through `.env` as `MILAPRO_REBUILD_WEBHOOK_URL` and `MILAPRO_REBUILD_WEBHOOK_SECRET`.

## Endpoints Used

- `GET /wp-json/wp/v2/products?_embed`
- `GET /wp-json/wp/v2/products?slug={slug}&_embed`
- `GET /wp-json/wp/v2/product_category?hide_empty=false`
- `GET /wp-json/wp/v2/reels`
- `GET /wp-json/wp/v2/posts?_embed`
- `GET /wp-json/wp/v2/posts?slug={slug}&_embed`

## Production Notes

- Do not install Elementor or use a WordPress theme to render the public site.
- Do not expose WordPress admin credentials in Astro.
- Keep WordPress REST endpoints public for read-only content.
- Configure CORS only if the browser needs to request WordPress directly; the current build-time integration does not require public browser-side CORS.
- Each content update triggers a static rebuild and FTP deploy, so public pages remain SEO-friendly and fast on HostGator.
