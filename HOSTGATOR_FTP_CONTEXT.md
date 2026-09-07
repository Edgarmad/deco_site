# HostGator FTP Context

## Connection

- Host: `ftp.milaprohome.com`
- Port: `21`
- Protocol: FTP
- User: `deploy@milaprohome.com`
- Password: store in .env as FTP_PASSWORD

## WordPress Paths

- FTP root `/` maps to the real public web root for this account. In cPanel terms, `/` is the effective `public_html`.
- WordPress root: `/cms/`
- Plugins directory: `/cms/wp-content/plugins/`
- Milapro plugin directory: `/cms/wp-content/plugins/milapro-headless-cms/`
- Milapro includes directory: `/cms/wp-content/plugins/milapro-headless-cms/includes/`

Note: FTP also exposes `/public_html/`, but that is an accidental folder created on 2026-08-23 or later, not the real public web root. Use `/cms/wp-content/plugins/milapro-headless-cms/` for plugin checks and uploads.

## Local Plugin Paths

- Plugin source: `wordpress/plugins/milapro-headless-cms/`
- Main plugin file: `wordpress/plugins/milapro-headless-cms/milapro-headless-cms.php`
- Includes source: `wordpress/plugins/milapro-headless-cms/includes/`

## Upload Missing Includes

Use these commands from the repo root after setting `FTP_PASSWORD` locally.

```powershell
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$env:FTP_PASSWORD" -T "wordpress\plugins\milapro-headless-cms\includes\class-seed-validator.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/includes/class-seed-validator.php"
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$env:FTP_PASSWORD" -T "wordpress\plugins\milapro-headless-cms\includes\class-seed-media-importer.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/includes/class-seed-media-importer.php"
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$env:FTP_PASSWORD" -T "wordpress\plugins\milapro-headless-cms\includes\class-seed-importer.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/includes/class-seed-importer.php"
curl.exe --ftp-create-dirs --user "deploy@milaprohome.com:$env:FTP_PASSWORD" -T "wordpress\plugins\milapro-headless-cms\includes\class-seed-import-admin.php" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/includes/class-seed-import-admin.php"
```

## Verify Remote Includes

```powershell
curl.exe --user "deploy@milaprohome.com:$env:FTP_PASSWORD" "ftp://ftp.milaprohome.com/cms/wp-content/plugins/milapro-headless-cms/includes/"
```

Expected files:

```text
class-seed-import-admin.php
class-seed-importer.php
class-seed-media-importer.php
class-seed-validator.php
```

## Notes

- The canonical plugin path `/cms/wp-content/plugins/milapro-headless-cms/` has been verified with `milapro-headless-cms.php` and `includes/` present.
- The local plugin matches the canonical FTP plugin by SHA-256 for the entry file and four include files.
- Do not deploy to `/public_html/`; deploy relative to `/` for this FTP account.
- Rotate or delete the FTP credentials after emergency use.
