# WordPress Product Media Library Migration Context

## Objective

Move product imagery ownership from static Astro/frontend assets to WordPress Media Library.

After this migration:

1. Product editors can upload, select, remove and reorder product images in WordPress.
2. Product main image and gallery are stored as WordPress attachment IDs.
3. The Astro frontend consumes image URLs from WordPress REST fields in the selected order.
4. Static local image fallbacks are only a temporary safety net, not the normal source of product imagery.
5. Manual `Deploy` from WordPress batches edits and triggers the existing GitHub Actions deploy once.

## Current Situation

Some products in WordPress do not have real WordPress Media Library attachments assigned.

Example verified on 2026-08-26:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?slug=ratan-marbella&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
```

Observed behavior:

```text
featured_media: 0
product_details.main_image: 0
product_details.gallery_images: paths like /productos-mila-web/ratan-marbella/main-01.png
gallery_urls: paths like /productos-mila-web/ratan-marbella/main-01.png
```

The images are visible on the public frontend because they exist as static Astro build assets:

```text
https://www.milaprohome.com/productos-mila-web/ratan-marbella/main-01.png
```

The same relative URL does not exist on the CMS domain:

```text
https://cms.milaprohome.com/productos-mila-web/ratan-marbella/main-01.png -> 404
```

This means the current public page is not fully driven by WordPress Media Library for affected products. It is using fallback/static image paths from the frontend seed/local data.

## Relevant Local Files

```text
wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php
wordpress/plugins/milapro-headless-cms/includes/class-seed-import-admin.php
wordpress/plugins/milapro-headless-cms/includes/class-seed-importer.php
wordpress/plugins/milapro-headless-cms/includes/class-seed-media-importer.php
wordpress/plugins/milapro-headless-cms/includes/class-seed-validator.php
wordpress/migration/seed.json
wordpress/migration/import-seed.php
public/productos-mila-web/
src/services/productService.ts
src/data/products.ts
src/components/product/ProductGallery.astro
docker-compose.yml
docs/wordpress-headless.md
```

## Current Plugin Behavior

The plugin registers:

```text
products custom post type
product_category taxonomy
reels custom post type
```

Product image-related meta:

```text
_milapro_main_image
_milapro_gallery_images
```

REST fields used by the frontend:

```text
products.main_image_url
products.gallery_urls
products.product_details
```

The desired final state is:

```text
_milapro_main_image = integer attachment ID
_milapro_gallery_images = ordered array of { image: integer attachment ID }
main_image_url = wp_get_attachment_image_url(_milapro_main_image, 'large') or featured image
gallery_urls = URLs generated from the ordered attachment IDs
```

Do not keep relative static paths as the primary stored gallery format after the migration is complete.

## FTP Connection

FTP is used to upload changed plugin files to HostGator.

```text
Host: ftp.milaprohome.com
Port: 21
Protocol: FTP
User: deploy@milaprohome.com
Password source: local .env file in repo root
```

Expected local environment variable:

```powershell
FTP_PASSWORD=...
```

Some older commands tolerate this typo:

```powershell
FPT_PASSWORD=...
```

Do not write the password into this file. Do not commit secrets.

Canonical remote plugin path:

```text
/cms/wp-content/plugins/milapro-headless-cms/
```

Important:

```text
/public_html/cms/wp-content/plugins/milapro-headless-cms/ is not the canonical deploy target.
Use /cms/wp-content/plugins/milapro-headless-cms/.
```

Confirm FTP access from repo root:

```powershell
$line = [System.IO.File]::ReadLines((Resolve-Path -LiteralPath ".env")).Where({ $_ -match '^\s*FTP_PASSWORD\s*=' -or $_ -match '^\s*FPT_PASSWORD\s*=' }, 'First') | Select-Object -First 1
$password = ($line -replace '^\s*(FTP_PASSWORD|FPT_PASSWORD)\s*=\s*', '').Trim()
if (($password.StartsWith('"') -and $password.EndsWith('"')) -or ($password.StartsWith("'") -and $password.EndsWith("'"))) { $password = $password.Substring(1, $password.Length - 2) }
curl.exe --user "deploy@milaprohome.com:$password" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/"
```

Upload one changed plugin file:

```powershell
$line = [System.IO.File]::ReadLines((Resolve-Path -LiteralPath ".env")).Where({ $_ -match '^\s*FTP_PASSWORD\s*=' -or $_ -match '^\s*FPT_PASSWORD\s*=' }, 'First') | Select-Object -First 1
$password = ($line -replace '^\s*(FTP_PASSWORD|FPT_PASSWORD)\s*=\s*', '').Trim()
if (($password.StartsWith('"') -and $password.EndsWith('"')) -or ($password.StartsWith("'") -and $password.EndsWith("'"))) { $password = $password.Substring(1, $password.Length - 2) }
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$password" -T "wordpress\plugins\milapro-headless-cms\milapro-headless-cms.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/milapro-headless-cms.php"
```

Verify remote file hash after upload:

```powershell
$remoteFile = "C:\Users\edmad\AppData\Local\Temp\opencode\milapro-headless-cms.remote.php"
curl.exe --user "deploy@milaprohome.com:$password" -o "$remoteFile" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/milapro-headless-cms.php"
$localHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "wordpress\plugins\milapro-headless-cms\milapro-headless-cms.php").Hash
$remoteHash = (Get-FileHash -Algorithm SHA256 -LiteralPath "$remoteFile").Hash
"local=$localHash"
"remote=$remoteHash"
if ($localHash -eq $remoteHash) { "MATCH" } else { "MISMATCH" }
```

## Local Docker WordPress

Local WordPress is defined in `docker-compose.yml`.

Services:

```text
wordpress: wordpress:6.6-php8.2-apache, currently mapped to localhost:8081
db: mysql:8.0
wpcli: wordpress:cli-php8.2, profile tools
```

Important mounts:

```text
./wordpress/plugins/milapro-headless-cms -> /var/www/html/wp-content/plugins/milapro-headless-cms
./wordpress/migration -> /var/www/html/migration
./public -> /var/www/html/migration-public:ro
./src/styles/images -> /var/www/html/migration-style-images:ro
```

The `./public` mount is important because `Milapro_Seed_Media_Importer` can copy local static images such as:

```text
public/productos-mila-web/ratan-marbella/main-01.png
```

from this container path:

```text
/var/www/html/migration-public/productos-mila-web/ratan-marbella/main-01.png
```

Standard startup command:

```powershell
docker compose up -d
```

Current local site:

```text
http://localhost:8081
http://localhost:8081/wp-json/wp/v2
```

Seed import command:

```powershell
npm run wp:seed
```

Individual seed steps:

```powershell
npm run wp:seed:build
npm run wp:seed:import
```

Equivalent WP-CLI import command:

```powershell
docker compose --profile tools run --rm wpcli wp eval-file /var/www/html/migration/import-seed.php
```

Local Docker status verified on 2026-08-26:

```text
revelo-db-1 is running
revelo-wordpress-1 is running
revelo-wordpress-1 exposes 0.0.0.0:8081->80/tcp
curl.exe -I http://localhost:8081 -> HTTP/1.1 200 OK
curl.exe http://localhost:8081/wp-json/wp/v2 -> REST API responds
docker compose --profile tools run --rm --no-deps wpcli wp --info -> WP-CLI responds, version 2.12.0
```

Earlier note: port `8080` was occupied by another container.

```text
autocreditexpress uses 0.0.0.0:8080->80/tcp
```

Do not assume local WordPress is on `8080`. Use the active Docker port shown by:

```powershell
docker compose ps
```

If local WordPress is not already mapped to an available port, do not stop unrelated containers unless the user explicitly approves. Safer options:

1. Temporarily change the WordPress port mapping in an override file from `8080:80` to an available port such as `8081:80` or `8082:80`.
2. Or ask the user for permission to stop the container using port `8080`.

Recommended temporary override for local testing:

```yaml
# docker-compose.override.yml
services:
  wordpress:
    ports:
      - "8081:80"
```

Then use:

```powershell
docker compose up -d
curl.exe -I "http://localhost:8081"
```

If using the current verified local port `8081`, use this for Astro local testing:

```env
WORDPRESS_API_URL=http://localhost:8081/wp-json/wp/v2
WORDPRESS_SITE_URL=http://localhost:8081
WORDPRESS_API_TIMEOUT_MS=8000
```

Local product media verification on 2026-08-26:

```powershell
curl.exe "http://localhost:8081/wp-json/wp/v2/products?slug=ratan-marbella&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url"
```

Observed local result summary:

```text
id: 90
slug: ratan-marbella
featured_media: 824
product_details.main_image: 824
product_details.gallery_images: [{ image: 824 }, { image: 825 }, { image: 826 }, { image: 827 }, { image: 828 }, { image: 829 }]
gallery_urls: http://localhost:8081/wp-content/uploads/... URLs in order
```

This confirms the local Docker WordPress already demonstrates the desired final model: product images imported as real WordPress attachments and returned by REST in gallery order.

## Recommended Implementation Plan For The LLM

### Phase 0: Inspect Before Editing

Read these files first:

```text
wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php
wordpress/plugins/milapro-headless-cms/includes/class-seed-importer.php
wordpress/plugins/milapro-headless-cms/includes/class-seed-media-importer.php
src/services/productService.ts
wordpress/migration/seed.json
docker-compose.yml
```

Check current git state:

```powershell
git status --short
git diff -- wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php
```

There may be unrelated user changes in the working tree. Do not revert unrelated changes.

### Phase 1: Validate Local WordPress

Bring up local WordPress. The current verified local port is `8081`. If a future run uses another port, follow `docker compose ps`.

Verify:

```powershell
curl.exe -I "http://localhost:8081"
docker compose --profile tools run --rm wpcli wp core is-installed
docker compose --profile tools run --rm wpcli wp plugin list
```

If WordPress is not installed, complete browser installer or install with WP-CLI.

Activate plugin locally:

```powershell
docker compose --profile tools run --rm wpcli wp plugin activate milapro-headless-cms
```

Import seed locally with media enabled:

```powershell
npm run wp:seed:build
docker compose --profile tools run --rm wpcli wp eval-file /var/www/html/migration/import-seed.php
```

The local import should create Media Library attachments because `./public` is mounted to `/var/www/html/migration-public:ro`.

Verify one product locally:

```powershell
curl.exe "http://localhost:8081/wp-json/wp/v2/products?slug=ratan-marbella&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url"
```

Expected after a successful media import:

```text
featured_media is not 0, or product_details.main_image is not 0
product_details.gallery_images contains attachment IDs, not /productos-mila-web paths
gallery_urls contains http://localhost:8081/wp-content/uploads/... URLs
```

### Phase 2: Build A Production-Safe Media Migration

Do not rely on the existing full seed import for production unless explicitly accepted. It may update many non-image fields.

Prefer a new one-time migration script focused only on product media.

Suggested file:

```text
wordpress/migration/migrate-product-media-to-wp.php
```

The script should:

1. Load `wordpress/migration/seed.json` locally or `/var/www/html/migration/seed.json` in WP-CLI.
2. Iterate `seed.products`.
3. Find the WordPress product by slug or `_milapro_source_slug`.
4. Import `sourceImage` through `Milapro_Seed_Media_Importer::attachment()`.
5. Set `_milapro_main_image` to the attachment ID.
6. Set WordPress featured image with `set_post_thumbnail()`.
7. Import each `gallery[]` item through `Milapro_Seed_Media_Importer::attachment()`.
8. Store `_milapro_gallery_images` as ordered `[['image' => attachment_id], ...]`.
9. Optionally import product color images and store IDs in `_milapro_colors[*].image`.
10. Use `_milapro_source_path` on attachments to avoid duplicate imports.
11. Produce a JSON report: products processed, images imported, images skipped, images failed, missing products, errors.

Important: `Milapro_Seed_Media_Importer` already deduplicates by `_milapro_source_path`. Reuse it instead of creating another downloader unless a specific limitation is found.

Production image source options:

1. Download from `https://www.milaprohome.com` using the existing fallback URL behavior.
2. Or upload/copy the `public/productos-mila-web/` folder to a temporary production-readable location before running migration.

For HostGator production, the simplest option is usually to download from the public frontend because the images are already available at:

```text
https://www.milaprohome.com/productos-mila-web/{slug}/{file}
```

If needed, define this in WordPress config before migration:

```php
define('MILAPRO_SEED_PUBLIC_BASE_URL', 'https://www.milaprohome.com');
```

### Phase 3: Plugin UI And REST Finalization

In `milapro-headless-cms.php`, ensure the product metabox:

1. Displays main image preview from attachment ID.
2. Displays gallery previews from attachment IDs.
3. Uses WordPress media picker for selecting/replacing images.
4. Supports row reordering with native JS buttons or drag-and-drop.
5. Saves `_milapro_gallery_images` in DOM order.
6. Does not convert attachment IDs back to static paths.

REST should return:

```text
main_image_url -> WordPress upload URL
product_details.gallery_images -> ordered attachment ID records
```

Keep manual Deploy behavior:

```text
Saving product/reel/category/blog does not trigger GitHub Actions.
Products list has Deploy button.
Reels list has Deploy button.
Clicking Deploy triggers one repository dispatch.
```

### Phase 4: Frontend Consumption Change

In `src/services/productService.ts`, update the fallback strategy after production media migration succeeds.

Current logic falls back to local static product images if WordPress images are missing.

Desired final logic:

1. Prefer `product.gallery_urls` from WP.
2. Prefer `product.main_image_url` from WP.
3. Use local static `localProduct.gallery` only as emergency fallback or remove it entirely.
4. If WP product exists but has no images, make that visible during development rather than silently masking it with static images.

Suggested safe transitional behavior:

```text
If WORDPRESS_API_URL is available and product exists in WP:
  use WP images first
  fallback to local images only if gallery_urls is empty
  log/build-warning if fallback is used
If WordPress is unavailable:
  use local static fallback
```

Final hardening after all products are migrated:

```text
If product exists in WP and has no WP images:
  show placeholder or fail build intentionally, depending on user preference
```

### Phase 5: Production Deployment Procedure

1. Test migration locally against Docker WordPress.
2. Verify at least these product slugs locally:

```text
ratan-sevilla
ratan-marbella
ratan-madrid
aluminio-onega
aluminio-caspio
plastico-silla-narciso
```

3. Review local diff.
4. Upload only changed plugin files by FTP.
5. If a production migration script is needed inside WordPress, upload it only to an intended migration path, run it once, then remove it or leave it outside public plugin execution paths.
6. Run production migration.
7. Verify REST on production:

```text
https://cms.milaprohome.com/wp-json/wp/v2/products?slug=ratan-marbella&_fields=id,slug,featured_media,product_details,gallery_urls,main_image_url
```

Expected production result:

```text
featured_media != 0 or product_details.main_image != 0
product_details.gallery_images contains numeric attachment IDs
```

8. Verify WordPress edit screen shows non-broken thumbnails from Media Library.
9. Save/reorder one product gallery.
10. Confirm saving does not trigger deploy automatically.
11. Click manual `Deploy` from Products list.
12. Verify public product page reflects the WordPress gallery order.

## Acceptance Criteria

Product media migration:

```text
Existing static product images are imported into WordPress Media Library.
Each migrated product has a real main image attachment.
Each migrated product has an ordered gallery of attachment IDs.
Repeated migration does not create duplicate attachments.
Migration produces a clear report.
```

WordPress editing:

```text
Product edit screen shows real image previews.
Editor can select/change main image using Media Library.
Editor can add/remove/reorder gallery images.
Saving persists attachment IDs in the selected order.
```

REST/API:

```text
main_image_url returns a WordPress uploads URL.
gallery_urls returns WordPress uploads URLs in saved order.
No product depends on /productos-mila-web/... as the primary image source after migration.
```

Frontend:

```text
Product page uses WP image URLs.
Manual Deploy updates the public Astro site.
Gallery order on public site matches WordPress order.
```

Deploy behavior:

```text
Save product does not trigger GitHub Actions.
Save reel does not trigger GitHub Actions.
Save category/blog does not trigger GitHub Actions.
Products and Reels list screens show Deploy button.
Deploy button triggers one GitHub Actions repository dispatch.
```

## Notes For Future LLM
## Phase 2
## Next Step: Editable Home Banners In WordPress

After the product media migration, the next requested change is to make specific home banners editable from the same `Milapro Headless CMS` WordPress plugin.

### Objective

Add a new admin section in the plugin for managing only these banner contents:

```text
Hero banner
Popup banner
Carousel banner
```

The editor should be able to change only:

```text
Text content
Image/background image
```

Do not change:

```text
Styles
Layout
Positioning
Animations
Popup behavior
Carousel behavior
Existing frontend structure
```

The frontend should keep the current design and behavior exactly as-is, but hydrate these specific text/image values from WordPress during build.

### Current Editable Targets

Hero banner on home:

```text
Current text: Oferta de verano
Current text: Hasta 50% de descuento
Needs editable background image
```

Popup banner shown when the page loads:

```text
Current text: Oferta por tiempo limitado
Current text: Obtén hasta 50% OFF
Needs editable image
```

Home carousel/banner near the start of the homepage:

```text
Current text: Oferta de verano
Current text: Hasta 50% de descuento
Needs editable image/content for this banner only
```

Important: if there are other banners, cards, sections, headings or images on the homepage, do not make them editable as part of this step unless explicitly requested later.

### WordPress Plugin Scope

Implement this inside the same plugin:

```text
wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php
```

Preferred admin model:

```text
Create one new admin menu/submenu section named Banners, Home Banners or similar.
Store banner values in WordPress options or a small custom post type.
Keep the data model minimal and fixed to the three banner slots.
Use WordPress Media Library attachment IDs for images.
Expose REST fields/endpoints consumed by Astro.
```

Suggested fixed keys:

```text
hero_banner
popup_banner
carousel_banner
```

Suggested fields per banner:

```text
eyebrow or label text
headline/title text
optional secondary text only if the current frontend element already has one
image attachment ID
image URL in REST response
```

Do not introduce a generic page builder, arbitrary HTML editor, styling controls, color controls, layout controls, or advanced banner scheduling unless explicitly requested.

### Deploy Behavior

Follow the existing manual deploy pattern:

```text
Saving banner content must not trigger GitHub Actions automatically.
The Banners admin section should include a Deploy button.
Clicking Deploy should trigger one GitHub Actions repository dispatch.
Products and Reels Deploy behavior must keep working.
```

This matches the existing content workflow:

```text
Editors can batch changes in WordPress.
The public static Astro site updates only after pressing Deploy.
```

### Frontend Scope

Find the current home implementations in `src/pages/index.astro` and related components/data files before editing.

Expected frontend behavior:

```text
During build, fetch banner content from WordPress.
If WordPress is unavailable, keep current hardcoded/local banner content as fallback.
If a banner image is not set in WordPress, keep the current local image fallback.
Only replace text/image values for the three requested banner elements.
Do not alter Tailwind classes, DOM placement, popup timing, carousel scripts or responsive behavior.
```

### Acceptance Criteria For Banner Work

```text
WordPress admin has a dedicated Banners section.
Editor can update hero banner text and background image.
Editor can update popup banner text and image.
Editor can update the home carousel banner text and image/content.
Images are selected from WordPress Media Library and stored as attachment IDs.
REST returns image URLs and text values for the three fixed banner slots.
Saving banner values does not deploy automatically.
Banners section has a manual Deploy button.
Public Astro homepage uses the WordPress banner values after manual deploy.
No style, layout, positioning or behavior changes are introduced.
```

Do not expose GitHub tokens or FTP passwords in logs, UI, docs, commits or final messages.

Do not delete the canonical plugin directory:

```text
/cms/wp-content/plugins/milapro-headless-cms/
```

Do not edit production directly by FTP unless necessary. Preferred workflow:

1. Edit locally.
2. Run syntax checks.
3. Review diff.
4. Upload only changed files.
5. Verify remote hash.
6. Test in WordPress.

Use small, focused changes. The riskiest part is data migration, not the admin UI.

## Phase 3
## Next Step: Editable Blogs In WordPress

After the editable home banners work, the next requested change is to make blogs fully editable from the same `Milapro Headless CMS` WordPress plugin.

### Objective

Add a new admin tab/section for blogs, similar to the existing Products and Reels workflow.

Editors should be able to:

```text
View the list of blogs in WordPress.
Add new blogs.
Edit existing blogs.
Delete blogs.
Set/change each blog image through WordPress Media Library.
Edit the blog text fields needed by the current frontend structure.
Trigger a manual Deploy after batching changes.
```

The Astro frontend should consume the blog list and blog detail content from WordPress during build.

If a blog is deleted in WordPress, it should disappear from the public blog listing and detail routes after deploy.

If a blog is added in WordPress, it should appear on the public blog listing and get its own detail page after deploy.

Blog images must be consumed from WordPress Media Library URLs, not local static images as the primary source.

### Current Editable Blog Text Targets

The current blog detail layout has these text sections that must be editable:

```text
Anchor/paragraph P near the top.
H1 title.
Main paragraph P after the H1.
Final content block/div containing a paragraph P.
```

Represent these as four explicit fields. Suggested field names:

```text
eyebrow or category_label
title
intro_text
body_text
```

If the current frontend blog card also needs a short summary/excerpt, reuse `intro_text` or add one minimal `excerpt` field only if required by the existing listing UI.

Do not introduce arbitrary page-builder blocks, styling controls, custom HTML, color controls, layout controls, scheduling, tags, authors, comments, or rich editor behavior unless explicitly requested later.

### WordPress Plugin Scope

Implement this inside the same plugin:

```text
wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php
```

Preferred admin/content model:

```text
Create/register a blogs custom post type, or use the native post type only if it is clearly simpler and does not conflict with existing content.
Show a Blogs admin menu/tab similar to Products and Reels.
Use WordPress title support for the H1 title if practical.
Use a meta box for the remaining fixed blog fields.
Use featured image or a fixed image meta field backed by WordPress Media Library attachment IDs.
Expose REST fields/endpoints consumed by Astro.
```

Suggested blog meta fields:

```text
_milapro_blog_eyebrow
_milapro_blog_intro_text
_milapro_blog_body_text
_milapro_blog_image
_milapro_blog_display_order
_milapro_blog_is_visible
```

Suggested REST shape for each blog:

```text
id
slug
blog_details.eyebrow
blog_details.intro_text
blog_details.body_text
blog_details.image
blog_image_url
blog_details.display_order
blog_details.is_visible
```

If using WordPress featured images, also set/read `featured_media`, but still expose a simple `blog_image_url` field so the frontend does not need to know WordPress internals.

### Deploy Behavior

Follow the existing manual deploy pattern:

```text
Saving a blog must not trigger GitHub Actions automatically.
Deleting a blog must not trigger GitHub Actions automatically.
The Blogs list screen should include a Deploy button.
Clicking Deploy should trigger one GitHub Actions repository dispatch.
Products, Reels and Home Banners Deploy behavior must keep working.
```

This matches the existing content workflow:

```text
Editors can batch changes in WordPress.
The public static Astro site updates only after pressing Deploy.
```

### Frontend Scope

Find the current blog implementation before editing:

```text
src/pages/blogs/index.astro
src/pages/blogs/[slug].astro
src/services/blogService.ts
src/data/siteContent.ts or any existing blog data file
```

Expected frontend behavior:

```text
During build, fetch blogs from WordPress.
Use only WordPress blogs when WordPress returns blog posts.
If WordPress is unavailable, keep current hardcoded/local blog content as fallback.
If a WordPress blog has no image, use local fallback only as an emergency fallback during transition.
Blog listing reflects only published/visible blogs from WordPress.
Blog detail routes are generated from WordPress blog slugs.
No styles, layout, positioning or responsive behavior should change.
```

### Acceptance Criteria For Blog Work

```text
WordPress admin has a dedicated Blogs section/tab.
Editor can view blog list.
Editor can add a new blog.
Editor can edit an existing blog.
Editor can delete a blog.
Editor can set/change the blog image from WordPress Media Library.
Editor can modify the four requested text fields.
REST returns published/visible blogs with WordPress image URLs.
Astro blog listing consumes WordPress blogs.
Astro blog detail pages consume WordPress blog content.
Deleting a blog in WordPress removes it from the public site after manual deploy.
Adding a blog in WordPress adds it to the public site after manual deploy.
Saving/deleting blogs does not deploy automatically.
Blogs list has a manual Deploy button.
No frontend style/layout/behavior changes are introduced.
```

Do not expose GitHub tokens or FTP passwords in logs, UI, docs, commits or final messages.

Use small, focused changes. Preserve the current blog design and only replace data ownership with WordPress.
