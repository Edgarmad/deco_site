import json
import os
import re
import unicodedata
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen

from openpyxl import load_workbook


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


def clean_color(value):
    value = re.sub(r'^a\d+[- ]', '', str(value or ''), flags=re.IGNORECASE)
    return (
        slug(value)
        .replace('brasillia', 'brasilia')
        .replace('mapple', 'maple')
        .replace('gray', 'grey')
        .replace('golded-mohed', 'gilded-mohe-stone')
        .replace('calcatta-gold', 'calacatta')
    )


PRODUCTS = {
    'LAMBRIN': 'panel-lambrin-wpc',
    'PANEL REFORZADO SPC': 'panel-reforzado-400',
    'PLAFON PVC': 'panel-techo-spc-3m-6m',
    'VIGAS WPC': 'vigas-interior',
    'PISO SPC': 'pisos-spc',
    'LAMBRIN ASA': 'lambrin-exterior',
    'WALL CLADDING ASA': 'wallcladding',
    'VIGA COEXTRUIDA': 'viga-exterior',
    'DECK COEXTRUIDO': 'deck',
}

VARIANTS = {
    'lambrin-premium-4': 'lambrin-premium-wpc',
    'lambrin-max-3': 'lambrin-premium-3-max',
    'lambrin-irregular': 'lambrin-irregular',
    'lambrin-wavy-max': 'lambrin-wavy-max',
    'cepillado': 'cepillado',
    'veta': 'veteado',
    'granito': 'granito',
    'madera': 'madera',
    '10-5': 'general',
    '6-4': 'general',
    'residencial': 'general',
    '6-metros': 'general',
    '3-metros': 'general',
    'naturales': 'general',
    'destellos': 'general',
}


def request_json(url, method='GET', payload=None, headers=None):
    body = json.dumps(payload).encode() if payload is not None else None
    request_headers = {'apikey': os.environ['SUPABASE_SERVICE_ROLE_KEY'], 'Authorization': f"Bearer {os.environ['SUPABASE_SERVICE_ROLE_KEY']}"}
    request_headers.update(headers or {})
    if body is not None:
        request_headers['Content-Type'] = 'application/json'
        request_headers['Prefer'] = 'return=minimal'
    request = Request(url, data=body, headers=request_headers, method=method)
    try:
        with urlopen(request) as response:
            content = response.read()
            return json.loads(content) if content else None
    except HTTPError as error:
        raise RuntimeError(error.read().decode()) from error


def main():
    load_env()
    base = os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1'
    options = request_json(base + '/product_options?select=id,slug')
    option_ids = {item['slug']: item['id'] for item in options}

    # Every existing option receives the temporary published price, including options without a spreadsheet match.
    for option_id in option_ids.values():
        request_json(f'{base}/product_options?id=eq.{quote(option_id)}', 'PATCH', {'price': 1.00, 'status': 'published'})

    sheet = load_workbook(ROOT / 'DECO_ABC_Plantilla_Inventario_Productos (1).xlsx', data_only=True, read_only=True)['Productos']
    rows = list(sheet.values)
    headers = list(rows[0])
    matched = 0
    unmatched = []
    seen = set()

    for row_number, row in enumerate(rows[1:], 2):
        record = dict(zip(headers, row))
        if not any(value is not None for value in row):
            continue
        product_slug = PRODUCTS.get(str(record['Producto ']).strip())
        family_slug = slug(str(record['Familia(Subcategoria)'] or '').replace('\xa0', ' ')) if record['Familia(Subcategoria)'] else 'general'
        variant_slug = VARIANTS.get(family_slug, family_slug)
        color_slug = clean_color(record['Variante / Color'])
        if product_slug == 'wallcladding':
            color_slug = f"{color_slug}-{family_slug}"
        if product_slug == 'deck' and '/' in str(record['Variante / Color']):
            color_slug = ''
        option_slug = '-'.join(part for part in (product_slug, '' if variant_slug == 'general' else variant_slug, color_slug) if part)
        option_id = option_ids.get(option_slug)
        if not option_id:
            if product_slug:
                unmatched.append((row_number, option_slug))
            continue
        if option_slug in seen:
            continue
        seen.add(option_slug)
        specs = {}
        if record['Peso por pieza (kg)'] is not None:
            specs['weight'] = f"{record['Peso por pieza (kg)']} kg"
        if record['Presentación']:
            specs['presentation'] = str(record['Presentación'])
        if record['Piezas por caja'] is not None:
            specs['pieces_per_box'] = f"{record['Piezas por caja']} piezas"
        if record['Cobertura por presentación'] is not None:
            unit = str(record['Unidad de cobertura'] or '').strip()
            specs['coverage'] = f"{record['Cobertura por presentación']} {unit}".strip()
        if record['Resistencia al agua']:
            specs['water_resistance'] = str(record['Resistencia al agua'])
        if record['Clasificación de fuego']:
            specs['fire_classification'] = str(record['Clasificación de fuego'])

        dimensions = None
        if record['Alto (cm)'] is not None and record['Ancho (cm)'] is not None:
            dimensions = f"{record['Alto (cm)']} x {record['Ancho (cm)']} cm"
        update = {
            'description': record['Descripción comercial'] or None,
            'dimensions': dimensions,
            'thickness': f"{record['Espesor (mm)']} mm" if record['Espesor (mm)'] is not None else None,
            'material': record['Material / composición'] or None,
            'usage': record['Uso recomendado'] or None,
            'care_notes': record['Cuidados'] or None,
            'technical_specs': specs,
            'price': 1.00,
            'status': 'published',
        }
        request_json(f'{base}/product_options?id=eq.{quote(option_id)}', 'PATCH', update)
        matched += 1

    print(json.dumps({'matched_rows': matched, 'published_options': len(option_ids), 'unmatched_rows': unmatched}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
