import io
import json
import os
import re
import unicodedata
from collections import OrderedDict
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from openpyxl import load_workbook
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parent.parent
PLACEHOLDER_PATH = 'products/_placeholder/product-placeholder.webp'

PRODUCT_SLUGS = {
    'LAMBRIN': 'panel-lambrin-wpc',
    'PANEL REFORZADO SPC': 'panel-reforzado-400',
    'PLAFON PVC': 'panel-techo-spc-3m-6m',
    'PLACAS MARMOL PVC': 'placas-marmol-pvc',
    'VIGAS WPC': 'vigas-interior',
    'PISO SPC': 'pisos-spc',
    'ACCESORIOS': 'accesorios',
    'LAMBRIN ASA': 'lambrin-exterior',
    'WALL CLADDING ASA': 'wallcladding',
    'DECK COEXTRUIDO': 'deck',
    'VIGA COEXTRUIDA': 'viga-exterior',
    'ANGULO ASA': 'angulo-asa',
    'ANGULO COEXTRUIDO': 'angulo-coextruido',
    'QUILLA WPC': 'quilla-wpc',
    'GRAPA DECK': 'grapa-deck',
}

PRODUCT_CATEGORY = {
    'Interior': 'interior',
    'Exterior': 'exterior',
    'Accesorio de instalación': 'accesorios',
}

VARIANT_SLUGS = {
    'lambrin premium 4': 'lambrin-premium-wpc',
    'lambrin max 3': 'lambrin-premium-3-max',
    'lambrin irregular': 'lambrin-irregular',
    'lambrin wavy max': 'lambrin-wavy-max',
    'veta': 'veta',
}


def load_env():
    for line in (ROOT / '.env').read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"\''))


def normalize(value):
    value = unicodedata.normalize('NFKD', str(value or '').lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', ' ', value).strip()


def slug(value):
    return normalize(value).replace(' ', '-')


def clean_color(value):
    value = re.sub(r'^a\d+[- ]', '', str(value or ''), flags=re.IGNORECASE)
    return slug(value).replace('brasillia', 'brasilia').replace('mapple', 'maple').replace('gray', 'grey')


def api(url, method='GET', payload=None, headers=None):
    body = payload if isinstance(payload, bytes) else json.dumps(payload).encode() if payload is not None else None
    auth = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    request_headers = {'apikey': auth, 'Authorization': f'Bearer {auth}'}
    request_headers.update(headers or {})
    if body is not None:
        request_headers.setdefault('Content-Type', 'application/json')
        request_headers.setdefault('Prefer', 'return=minimal')
    try:
        with urlopen(Request(url, data=body, headers=request_headers, method=method)) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except HTTPError as error:
        raise RuntimeError(f'{method} {url}: {error.read().decode()}') from error


def rest(path, method='GET', payload=None, headers=None):
    return api(os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/' + path, method, payload, headers)


def storage_put(path, content):
    auth = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    url = os.environ['SUPABASE_URL'].rstrip('/') + '/storage/v1/object/site-media/' + quote(path, safe='/')
    api(url, 'PUT', content, {'Content-Type': 'image/webp', 'x-upsert': 'true'})


def placeholder_bytes():
    image = Image.new('RGB', (640, 640), '#f0f0ec')
    draw = ImageDraw.Draw(image)
    draw.rectangle((100, 100, 540, 540), outline='#003b90', width=5)
    draw.line((100, 320, 540, 320), fill='#009844', width=3)
    draw.line((320, 100, 320, 540), fill='#009844', width=3)
    draw.text((170, 570), 'DECO ABC', fill='#003b90')
    output = io.BytesIO()
    image.save(output, format='WEBP', quality=48, method=6)
    return output.getvalue()


def canonical_key(product, family, color):
    product_slug = PRODUCT_SLUGS[product]
    family_label = normalize(family) if family else 'general'
    family_slug = VARIANT_SLUGS.get(family_label, slug(family_label))
    color_slug = clean_color(color)
    if product == 'WALL CLADDING ASA':
        color_slug = f'{color_slug}-{family_slug}'
    if product == 'DECK COEXTRUIDO' and '/' in str(color):
        color_slug = clean_color(color).replace('-', '')
    return product_slug, family_slug, color_slug


def canonical_option_slug(product, family, color):
    product_slug, family_slug, color_slug = canonical_key(product, family, color)
    # Keep the established compact slug for general variants.
    return '-'.join(part for part in (product_slug, '' if family_slug == 'general' else family_slug, color_slug) if part)


def technical_specs(row):
    values = {}
    if row['Peso por pieza (kg)'] is not None:
        values['weight'] = f"{row['Peso por pieza (kg)']} kg"
    if row['Presentación']:
        values['presentation'] = str(row['Presentación'])
    if row['Piezas por caja'] is not None:
        values['pieces_per_box'] = f"{row['Piezas por caja']} piezas"
    if row['Cobertura por presentación'] is not None:
        unit = str(row['Unidad de cobertura'] or '').strip()
        values['coverage'] = f"{row['Cobertura por presentación']} {unit}".strip()
    if row['Resistencia al agua']:
        values['water_resistance'] = str(row['Resistencia al agua'])
    if row['Clasificación de fuego']:
        values['fire_classification'] = str(row['Clasificación de fuego'])
    return values


def option_update(row, product_id, variant_id, option_slug):
    dimensions = None
    if row['Alto (cm)'] is not None and row['Ancho (cm)'] is not None:
        dimensions = f"{row['Alto (cm)']} x {row['Ancho (cm)']} cm"
    return {
        'variant_id': variant_id,
        'name': str(row['Variante / Color']).strip(),
        'slug': option_slug,
        'sku': str(row['SKU']).strip() if row['SKU'] else None,
        'description': row['Descripción comercial'] or None,
        'color_name': str(row['Variante / Color']).strip(),
        'color_slug': clean_color(row['Variante / Color']),
        'dimensions': dimensions,
        'thickness': f"{row['Espesor (mm)']} mm" if row['Espesor (mm)'] is not None else None,
        'material': row['Material / composición'] or None,
        'usage': row['Uso recomendado'] or None,
        'care_notes': row['Cuidados'] or None,
        'technical_specs': technical_specs(row),
        'price': 1.00,
        'status': 'published',
        'featured': False,
        'sort_order': 0,
        'canonical_path': f'/productos/{option_slug}',
        'fallback_image_path': PLACEHOLDER_PATH,
    }


def main():
    load_env()
    base = os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1'
    workbook = load_workbook(ROOT / 'DECO_ABC_Plantilla_Inventario_Productos (1).xlsx', data_only=True, read_only=True)['Productos']
    rows = list(workbook.values)
    headers = list(rows[0])
    canonical_rows = OrderedDict()
    duplicate_rows = []
    for row_number, values in enumerate(rows[1:], 2):
        row = dict(zip(headers, values))
        if not any(value is not None for value in values):
            continue
        key = (str(row['Producto ']).strip(), str(row['Familia(Subcategoria)'] or '').strip(), str(row['Categoría de uso']).strip(), str(row['Variante / Color']).strip())
        if key in canonical_rows:
            duplicate_rows.append(row_number)
            continue
        canonical_rows[key] = row

    old_options = rest('product_options?select=slug,name,color_name,product_variants(name,slug,products(name,slug))')
    image_rows = rest('product_images?select=option_id,storage_bucket,storage_path,original_filename,alt_text,kind,sort_order,product_options(slug)')
    images_by_old_slug = {}
    for image in image_rows:
        option = image.get('product_options') or {}
        if option.get('slug'):
            images_by_old_slug.setdefault(option['slug'], []).append(image)

    def old_option_canonical_slug(option):
        variant = option.get('product_variants') or {}
        product = variant.get('products') or {}
        old_product = product.get('name')
        old_variant = variant.get('name')
        old_color = option.get('color_name') or option.get('name')
        product_map = {
            'panel lambrin wpc': 'LAMBRIN',
            'panel reforzado 400': 'PANEL REFORZADO SPC',
            'panel techo spc 3m 6m': 'PLAFON PVC',
            'placas marmol destellos': 'PLACAS MARMOL PVC',
            'placas tipo marmol': 'PLACAS MARMOL PVC',
            'vigas interior': 'VIGAS WPC',
            'pisos spc': 'PISO SPC',
            'lambrin exterior': 'LAMBRIN ASA',
            'wallcladding': 'WALL CLADDING ASA',
            'viga exterior': 'VIGA COEXTRUIDA',
        }
        old_product_normal = normalize(old_product)
        canonical_product = product_map.get(old_product_normal)
        if not canonical_product:
            return None
        if old_product_normal == 'placas marmol destellos':
            old_variant = 'DESTELLOS'
        elif old_product_normal == 'placas tipo marmol':
            old_variant = 'NATURALES'
        elif old_product_normal == 'wallcladding':
            match = re.match(r'(.+) (Cepillado|Veteado)$', str(old_color), re.IGNORECASE)
            if match:
                old_color, old_variant = match.groups()
        elif old_variant == 'Veteado':
            old_variant = 'Veta'
        return canonical_option_slug(canonical_product, old_variant if old_variant != 'General' else None, old_color)

    old_image_map = {}
    for option in old_options:
        canonical_slug = old_option_canonical_slug(option)
        if canonical_slug:
            old_image_map.setdefault(canonical_slug, []).extend(images_by_old_slug.get(option['slug'], []))

    # Products are rebuilt from the canonical workbook. Storage objects remain intact.
    rest('products?id=not.is.null', 'DELETE')
    rest('categories?id=not.is.null', 'DELETE')

    category_ids = {}
    for order, (name, category_slug) in enumerate((('Interior', 'interior'), ('Exterior', 'exterior'), ('Accesorio de instalación', 'accesorios'))):
        category = rest('categories?select=id&slug=eq.' + quote(category_slug, safe=''))
        if category:
            category_ids[category_slug] = category[0]['id']
            rest(f"categories?id=eq.{category[0]['id']}", 'PATCH', {'name': name, 'status': 'published', 'sort_order': order})
        else:
            created = rest('categories', 'POST', {'name': name, 'slug': category_slug, 'status': 'published', 'sort_order': order}, {'Prefer': 'return=representation'})
            category_ids[category_slug] = created[0]['id']

    product_ids = {}
    products = OrderedDict()
    for product, family, use, color in canonical_rows:
        products.setdefault((product, use), PRODUCT_SLUGS[product])
    for order, ((product, use), product_slug) in enumerate(products.items()):
        category_slug = PRODUCT_CATEGORY[use]
        created = rest('products', 'POST', {
            'category_id': category_ids[category_slug],
            'name': product,
            'slug': product_slug,
            'status': 'published',
            'sort_order': order,
        }, {'Prefer': 'return=representation,resolution=merge-duplicates'})
        product_ids[(product, use)] = created[0]['id']

    variant_ids = {}
    option_records = []
    for (product, family, use, color), row in canonical_rows.items():
        product_id = product_ids[(product, use)]
        _, family_slug, _ = canonical_key(product, family, color)
        variant_key = (product_id, family_slug)
        if variant_key not in variant_ids:
            variant = rest('product_variants', 'POST', {
                'product_id': product_id,
                'name': family or 'General',
                'slug': family_slug,
                'status': 'published',
                'sort_order': len(variant_ids),
            }, {'Prefer': 'return=representation'})
            variant_ids[variant_key] = variant[0]['id']
        option_slug = canonical_option_slug(product, family, color)
        record = option_update(row, product_id, variant_ids[variant_key], option_slug)
        created = rest('product_options', 'POST', record, {'Prefer': 'return=representation'})
        option_records.append((option_slug, created[0]['id']))

    storage_put(PLACEHOLDER_PATH, placeholder_bytes())
    preserved_images = 0
    fallback_options = 0
    for option_slug, option_id in option_records:
        # Existing image paths are preserved only when the canonical slug is unchanged.
        images = old_image_map.get(option_slug, [])
        if images:
            for image in images:
                rest('product_images', 'POST', {
                    'option_id': option_id,
                    'storage_bucket': image['storage_bucket'],
                    'storage_path': image['storage_path'],
                    'original_filename': image.get('original_filename'),
                    'alt_text': image.get('alt_text'),
                    'kind': image['kind'],
                    'sort_order': image.get('sort_order') or 0,
                })
                preserved_images += 1
            rest(f'product_options?id=eq.{quote(option_id)}', 'PATCH', {'fallback_image_path': None})
        else:
            fallback_options += 1

    report = {
        'canonical_rows': len(canonical_rows),
        'duplicate_rows_ignored': duplicate_rows,
        'products_published': len(product_ids),
        'options_published': len(option_records),
        'preserved_image_rows': preserved_images,
        'fallback_options': fallback_options,
        'retired_products': ['Cristal Carbono', 'Piedra Flexible', 'Piedra Pu'],
        'placeholder_path': PLACEHOLDER_PATH,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
