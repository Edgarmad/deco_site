# Milapro Plugin Change Context

## Objective

Use this file as the working context for future changes to the WordPress plugin `milapro-headless-cms`.

The preferred workflow is:

1. Edit the plugin locally.
2. Review the local diff.
3. Upload only the changed files by FTP.
4. Test the plugin in WordPress.
5. If needed, re-upload the previous version of the changed file.

Avoid editing production files directly over FTP except for urgent one-line fixes.

## FTP Connection

- Host: `ftp.milaprohome.com`
- Port: `21`
- Protocol: FTP
- User: `deploy@milaprohome.com`
- Password source: local `.env` file in the repo root.

The password must not be written into this file or committed to Git.

Expected `.env` variable name:

```powershell
FTP_PASSWORD=...
```

Some existing local commands also tolerate the typo:

```powershell
FPT_PASSWORD=...
```

Prefer `FTP_PASSWORD` going forward.

## Remote WordPress Paths

- FTP root `/` maps to the real public web root for this account. In cPanel terms, `/` is the effective `public_html`.
- WordPress root: `/cms/`
- Plugins directory: `/cms/wp-content/plugins/`
- Plugin directory: `/cms/wp-content/plugins/milapro-headless-cms/`
- Plugin includes directory: `/cms/wp-content/plugins/milapro-headless-cms/includes/`

Important FTP note: `/public_html/` is not the real web root here. It is an accidental folder created on 2026-08-23 or later. Treat `/cms/wp-content/plugins/milapro-headless-cms/` as the canonical plugin path.

## Local Plugin Paths

- Plugin source: `wordpress/plugins/milapro-headless-cms/`
- Main plugin file: `wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php`
- Includes source: `wordpress/plugins/milapro-headless-cms/includes/`

## Confirm FTP Access

Use this from the repo root to confirm credentials and list the remote plugin directory:

```powershell
$line = [System.IO.File]::ReadLines((Resolve-Path -LiteralPath ".env")).Where({ $_ -match '^\s*FTP_PASSWORD\s*=' -or $_ -match '^\s*FPT_PASSWORD\s*=' }, 'First') | Select-Object -First 1
$password = ($line -replace '^\s*(FTP_PASSWORD|FPT_PASSWORD)\s*=\s*', '').Trim()
if (($password.StartsWith('"') -and $password.EndsWith('"')) -or ($password.StartsWith("'") -and $password.EndsWith("'"))) { $password = $password.Substring(1, $password.Length - 2) }
curl.exe --user "deploy@milaprohome.com:$password" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/"
```

## Upload A Changed File

Example for uploading one changed include file:

```powershell
$line = [System.IO.File]::ReadLines((Resolve-Path -LiteralPath ".env")).Where({ $_ -match '^\s*FTP_PASSWORD\s*=' -or $_ -match '^\s*FPT_PASSWORD\s*=' }, 'First') | Select-Object -First 1
$password = ($line -replace '^\s*(FTP_PASSWORD|FPT_PASSWORD)\s*=\s*', '').Trim()
if (($password.StartsWith('"') -and $password.EndsWith('"')) -or ($password.StartsWith("'") -and $password.EndsWith("'"))) { $password = $password.Substring(1, $password.Length - 2) }
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$password" -T "wordpress\plugins\milapro-headless-cms\includes\example.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/includes/example.php"
```

Replace `example.php` with the actual changed file.

## Delete/Rename Notes

FTP can create, rename, overwrite, and delete files inside the plugin directory using the current credentials.

Deleting a complete plugin folder by FTP may fail if the folder is not empty. cPanel File Manager can delete directories recursively, while FTP clients often require deleting all child files/subfolders first.

Do not delete `/cms/wp-content/plugins/milapro-headless-cms/` unless explicitly requested.

## Current Remote Includes

The canonical remote includes directory has previously been verified with these files:

```text
class-seed-import-admin.php
class-seed-importer.php
class-seed-media-importer.php
class-seed-validator.php
```

## Current FTP Verification

Verified on 2026-08-25 against `/cms/wp-content/plugins/milapro-headless-cms/`.

- Remote plugin directory contains `milapro-headless-cms.php` and `includes/`.
- The remote plugin is reported as active in WordPress and is expected to be the latest working version.
- The remote entry file and four include files match the local files by SHA-256:

```text
milapro-headless-cms.php
includes/class-seed-validator.php
includes/class-seed-media-importer.php
includes/class-seed-importer.php
includes/class-seed-import-admin.php
```

Observed duplicate/incomplete path: `/public_html/cms/wp-content/plugins/milapro-headless-cms/` lists only `includes/` and belongs to the accidental `/public_html/` folder. Do not use it as a deploy target.

## Current Plugin Functionality

The local plugin source is `wordpress/plugins/milapro-headless-cms/`. The main file is `milapro-headless-cms.php` and it loads the four importer includes from `includes/`.

### Boot And Compatibility

- Defines `MILAPRO_HEADLESS_VERSION` and `MILAPRO_HEADLESS_PLUGIN_FILE` as version/file constants.
- Detects `MILAPRO_HEADLESS_PLUGIN_DIR` by checking the normal plugin directory and known nested-folder candidates.
- Loads importer classes only when each include file is readable.
- Provides PHP polyfills for `str_starts_with()` and `str_contains()` when running on older PHP versions.
- Shows an admin error notice if the importer admin class cannot be loaded.

### WordPress Content Models

The plugin registers these public REST-enabled models on `init`:

- `products` custom post type with title, editor, excerpt, featured image and revisions.
- `product_category` hierarchical taxonomy assigned to `products`.
- `reels` custom post type with title, featured image and revisions.

Standard WordPress `post` remains the model for blog entries.

### Editable Admin Fields

The plugin supports two editing modes:

- Native WordPress metaboxes for `products` and `reels`, so Advanced Custom Fields is not required for normal editing.
- ACF local field groups when ACF is available, keeping the same field names visible through ACF-compatible screens.

Product fields saved in post meta:

```text
_milapro_price
_milapro_compare_at_price
_milapro_sku
_milapro_available
_milapro_featured
_milapro_display_order
_milapro_collection
_milapro_brand
_milapro_dimensions
_milapro_keywords
_milapro_main_image
_milapro_gallery_images
_milapro_colors
_milapro_variants
_milapro_specifications
```

Category fields saved in term meta:

```text
_milapro_category_image
_milapro_eyebrow
_milapro_display_order
_milapro_featured
```

Reel fields saved in post meta:

```text
_milapro_video_url
_milapro_cover_image
_milapro_platform
_milapro_display_order
_milapro_is_visible
```

### REST API Additions

The plugin adds computed REST fields used by the Astro frontend:

- `products.product_details`: normalized product meta including price, availability, gallery, colors, variants and specs.
- `products.gallery_urls`: image URLs extracted from gallery image IDs or ACF image arrays.
- `products.main_image_url`: main image URL, falling back to the featured image.
- `product_category.category_image_url`: category image URL.
- `product_category.category_details`: eyebrow, order, featured flag and image ID.
- `reels.reel_details`: video URL, cover image ID, platform, order and visibility.
- `reels.cover_image_url`: cover image URL, falling back to the featured image.

### Admin UI Behavior

- Enqueues WordPress media picker in admin.
- Adds inline JavaScript for selecting/removing media and adding/removing gallery, color, variant and specification rows.
- Adds compact inline CSS for product/reel metabox layouts.
- Saves product, category and reel meta through WordPress hooks with nonce checks on post metabox saves.

### Seed Import Tool

`Milapro_Seed_Import_Admin` registers a Tools page named `Importar catálogo MilaPro`.

The page can:

- Upload a `seed.json` file into `wp-content/uploads/milapro-seed/seed.json`.
- Validate expected seed sections: `categories`, `products`, `reels`, `blogs`.
- Import content by AJAX batches to reduce timeout risk on shared HostGator hosting.
- Continue an interrupted import using the saved option `milapro_seed_import_state`.
- Optionally skip media import, which is checked by default.
- Run a one-click verified price update for a fixed list of product slugs from August 2026.

The importer upserts records by slug or `_milapro_source_slug`, so repeating an import updates existing content instead of creating duplicates.

### Seed Media Import

`Milapro_Seed_Media_Importer` imports images from:

- Absolute `http://` or `https://` URLs.
- Plugin-local `seed-assets/` files.
- Migration folders under the plugin or WordPress root.
- Public-site fallback URLs for paths beginning with `/`.

Imported attachments are tagged with `_milapro_source_path` to avoid duplicate uploads on repeated imports.

### Rebuild Webhook

The plugin triggers a GitHub repository dispatch rebuild when published `products`, `reels`, normal blog `post`, or `product_category` terms change.

Required constants:

```php
define('MILAPRO_REBUILD_WEBHOOK_URL', 'https://api.github.com/repos/OWNER/REPO/dispatches');
define('MILAPRO_REBUILD_WEBHOOK_SECRET', 'github-token-here');
```

Webhook behavior:

- Skips seed imports via `MILAPRO_IMPORTING_SEED`.
- Skips revisions, autosaves and unpublished posts.
- Sends at most one webhook per request.
- Sends the event type `wordpress_content_changed`.
- Logs GitHub/API failures only when `WP_DEBUG` is enabled.

## Requested Plugin Changes

### Change 1: Manual Deploy Button For Products And Reels Changes

Current behavior:

```text
- Every save/update in products, reels, blog posts or product categories can trigger `milapro_send_rebuild_webhook()`.
- That webhook starts GitHub Actions, which builds and deploys the Astro frontend.
- This creates too many GitHub Actions calls while editing multiple products or making iterative changes.
```

Required behavior:

```text
- Saving products, reels, blog posts or product categories should not automatically trigger GitHub Actions deploys.
- Add a separate manual `Deploy` button in the main Products admin screen:
  https://cms.milaprohome.com/wp-admin/edit.php?post_type=products
- Place the `Deploy` button next to the existing `Add New Product` button in the Products list page header.
- Add the same manual `Deploy` behavior for reels in the main Reels admin screen:
  https://cms.milaprohome.com/wp-admin/edit.php?post_type=reels
- Place the Reels `Deploy` button next to the existing `Add New Reel` button in the Reels list page header.
- New content changes should be reflected on the public site only after clicking `Deploy`.
- Newly created products should exist in WordPress after saving, but should only appear on the public Astro site after clicking `Deploy`.
- Newly created reels should exist in WordPress after saving, but should only appear on the public Astro site after clicking `Deploy`.
- Deleted products should be removed from WordPress immediately, but should only disappear from the public Astro site after clicking `Deploy`.
- Deleted reels should be removed from WordPress immediately, but should only disappear from the public Astro site after clicking `Deploy`.
- The deploy button should call the existing rebuild webhook flow once.
- The goal is to batch many WordPress edits into one explicit GitHub Actions deploy.
```

Implementation notes:

```text
- Remove or disable automatic rebuild triggers from save hooks.
- Keep `milapro_send_rebuild_webhook()` as the single webhook sender.
- Add admin UI actions on the `products` and `reels` list pages.
- Prefer WordPress admin header/button styling so the deploy button visually matches the existing `Add New Product` and `Add New Reel` actions.
- Protect the deploy action with capability checks and a nonce.
- Show a clear success/error admin notice after clicking deploy.
- Do not expose GitHub token values in the UI or logs.
```

Acceptance criteria:

```text
- Editing and saving a product does not trigger GitHub Actions.
- Editing and saving a product category does not trigger GitHub Actions.
- Editing and saving a reel or blog post does not trigger GitHub Actions.
- Deleting a product does not trigger GitHub Actions.
- Deleting a reel does not trigger GitHub Actions.
- The Products list page shows a `Deploy` button.
- The `Deploy` button appears next to `Add New Product`.
- The Reels list page shows a `Deploy` button.
- The Reels `Deploy` button appears next to `Add New Reel`.
- Creating a new product does not update the public Astro site until `Deploy` is clicked and the deploy finishes.
- Creating a new reel does not update the public Astro site until `Deploy` is clicked and the deploy finishes.
- Deleting a product does not update the public Astro site until `Deploy` is clicked and the deploy finishes.
- Deleting a reel does not update the public Astro site until `Deploy` is clicked and the deploy finishes.
- Clicking `Deploy` triggers one GitHub Actions repository dispatch.
- Public frontend changes are expected to appear only after the manual deploy finishes.
```

### Change 2: Editable Product Gallery Image Order

Current behavior:

```text
- Product gallery order is stored implicitly in `_milapro_gallery_images`.
- The REST field `gallery_urls` preserves that stored array order.
- The deployed product detail page renders images in that order.
- The plugin UI currently allows adding/removing gallery images, but does not provide an obvious way to reorder existing images.
```

Required behavior:

```text
- Product editors must be able to change the order of gallery images from the product edit screen.
- The saved order must update `_milapro_gallery_images`.
- The REST field `gallery_urls` must keep returning images in the saved order.
- The deployed Astro product page should reflect the new order after the manual `Deploy` button is clicked and the deploy finishes.
```

Implementation constraints:

```text
- Do not use paid plugins, paid libraries, SaaS tools or any paid WordPress add-on.
- Prefer a custom implementation inside `milapro-headless-cms`.
- A simple functional custom UI is acceptable, for example `Move up` / `Move down` buttons on each gallery row.
- Drag and drop is optional; only add it if it can be done with native browser/WordPress assets without paid dependencies.
- Keep the implementation small and compatible with HostGator shared hosting.
```

Acceptance criteria:

```text
- Product gallery rows can be reordered in wp-admin without installing anything paid.
- Saving the product persists the new gallery order.
- `gallery_urls` returns the reordered URLs in the same order.
- The public product detail page reflects the reordered gallery after clicking manual `Deploy`.
```

### Change 3: Reel Cover Image Preview And Editing

Current behavior:

```text
- The deployed Astro page can show static reel thumbnails from `/instagram-reels/reel-01.jpg` through `/instagram-reels/reel-09.jpg`.
- WordPress reels currently return `cover_image: 0`, `cover_image_url: ""` and `featured_media: 0` in the REST API when no cover image has been assigned/imported.
- The plugin stores reel cover images in `_milapro_cover_image`.
- The reel edit metabox only shows a text label with the selected attachment filename, or `No image selected`.
- There is no image preview in the reel edit screen, making it hard to see, verify or change the selected reel cover image.
```

Required behavior:

```text
- Reel editors must be able to see the current cover image preview directly in the reel edit screen.
- Reel editors must be able to select/change the cover image using the existing WordPress media picker.
- If no cover image is selected, the UI should clearly show an empty state.
- Saving the reel must persist the selected image ID in `_milapro_cover_image`.
- `cover_image_url` must return the selected image URL after save.
- The deployed Astro page should reflect changed reel images after clicking manual `Deploy`.
```

Implementation constraints:

```text
- Do not use paid plugins, paid libraries, SaaS tools or any paid WordPress add-on.
- Prefer a custom implementation inside `milapro-headless-cms` using the existing WordPress media picker.
- Keep the UI simple and functional: thumbnail preview, selected filename, `Select Image` and optional `Remove Image` action.
- Keep compatibility with HostGator shared hosting.
```

Acceptance criteria:

```text
- The reel edit screen shows a visible preview when `_milapro_cover_image` has an attachment ID.
- Selecting a new image updates the preview immediately in wp-admin.
- Saving the reel persists the selected cover image.
- The REST field `cover_image_url` returns a non-empty URL when a cover image is selected.
- No paid plugin or paid dependency is required.
```

## Implementation Checklist

Before editing:

```text
- Read the relevant local plugin files.
- Identify the smallest correct change.
- Avoid touching unrelated files.
```

Before uploading:

```text
- Review `git diff`.
- Upload only changed plugin files.
- Do not upload `.env` or context files.
```

After uploading:

```text
- Verify the remote file exists if practical.
- Test the WordPress plugin behavior.
- Keep a note of uploaded files and test result.
```
