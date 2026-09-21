import json
import os
import re
import unicodedata
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent.parent


def load_env():
    for line in (ROOT / '.env').read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"\''))


def slug(value):
    value = unicodedata.normalize('NFKD', str(value or '').lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', value).strip('-')


def normalize(value):
    return slug(value).replace('-', ' ')


def safe_slug(value):
    return slug(value)


def api(path, method='GET', payload=None):
    auth = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    body = json.dumps(payload).encode() if payload is not None else None
    headers = {'apikey': auth, 'Authorization': f'Bearer {auth}'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
        headers['Prefer'] = 'return=minimal'
    try:
        with urlopen(Request(os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/' + path, data=body, headers=headers, method=method)) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except HTTPError as error:
        raise RuntimeError(error.read().decode()) from error


def canonical_option_slug(product, variant, color):
    product_map = {
        'panel lambrin wpc': 'panel-lambrin-wpc',
        'panel reforzado 400': 'panel-reforzado-400',
        'panel techo spc 3m 6m': 'panel-techo-spc-3m-6m',
        'placas marmol destellos': 'placas-marmol-pvc',
        'placas tipo marmol': 'placas-marmol-pvc',
        'vigas interior': 'vigas-interior',
        'pisos spc': 'pisos-spc',
        'lambrin exterior': 'lambrin-exterior',
        'wallcladding': 'wallcladding',
    }
    product_normal = normalize(product)
    product_slug = product_map.get(product_normal)
    if not product_slug:
        return None
    if product_normal in ('placas marmol destellos', 'placas tipo marmol'):
        variant_slug = 'destellos' if product_normal == 'placas marmol destellos' else 'naturales'
    elif product_normal == 'wallcladding':
        match = re.match(r'(.+) (cepillado|veteado)$', color, re.IGNORECASE)
        if not match:
            return None
        color, variant = match.groups()
        variant_slug = variant.lower()
    elif variant == 'Veteado':
        variant_slug = 'veta'
    elif variant == 'General':
        variant_slug = 'general'
    elif variant == 'Lambrin Premium Wpc':
        variant_slug = 'lambrin-premium-wpc'
    elif variant == 'Lambrin Premium 3 Max':
        variant_slug = 'lambrin-premium-3-max'
    else:
        variant_slug = slug(variant)
    color_slug = slug(color)
    if color_slug == 'mapple':
        color_slug = 'maple'
    if color_slug == 'brasillia':
        color_slug = 'brasilia'
    return '-'.join(part for part in (product_slug, '' if variant_slug == 'general' else variant_slug, color_slug) if part)


def old_storage_path(product, variant, color, kind, index):
    option_slug = f"{product['slug']}-{color['slug']}" if variant['slug'] == 'general' else f"{product['slug']}-{variant['slug']}-{color['slug']}"
    name_parts = [product['slug'], '' if variant['slug'] == 'general' else variant['slug'], color['slug'], kind]
    name = '-'.join(part for part in name_parts if part)
    return f"products/{product['slug']}/{variant['slug']}/{option_slug}/{kind}/{str(index + 1).zfill(2)}-{safe_slug(name)}.webp"


def main():
    load_env()
    options = api('product_options?select=id,slug')
    option_ids = {item['slug']: item['id'] for item in options}
    inventory = json.loads((ROOT / 'inventario_final.json').read_text(encoding='utf-8'))
    inserted = 0
    skipped = 0

    for category in inventory.get('categories', []):
        for product in category.get('products', []):
            for variant in product.get('variants', []):
                for color in variant.get('colors', []):
                    target_slug = canonical_option_slug(product['name'], variant['name'], color['name'])
                    option_id = option_ids.get(target_slug or '')
                    if not option_id:
                        continue
                    groups = [('main', color.get('images', {}).get('main', [])), ('secondary', color.get('images', {}).get('secondary', [])), ('extra', color.get('images', {}).get('extras', []))]
                    for kind, images in groups:
                        for index, image in enumerate(images):
                            path = old_storage_path(product, variant, color, kind, index)
                            api('product_images', 'POST', {
                                'option_id': option_id,
                                'storage_bucket': 'site-media',
                                'storage_path': path,
                                'original_source_path': image.get('path'),
                                'original_filename': image.get('title'),
                                'alt_text': f"{product['name']} {color['name']}",
                                'kind': kind,
                                'sort_order': inserted,
                            })
                            inserted += 1

    print(json.dumps({'restored_image_rows': inserted, 'canonical_options': len(option_ids)}, indent=2))


if __name__ == '__main__':
    main()
