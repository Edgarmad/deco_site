import type { Product, ProductCategory } from '../types/products';

export const productCategories: ProductCategory[] = [
  {
    id: 'interior-panel-lambrin-wpc',
    name: 'Panel Lambrin WPC',
    slug: 'panel-lambrin-wpc',
    macroCategory: 'interior',
    description: 'Paneles decorativos para muros interiores.',
    count: 4
  },
  {
    id: 'interior-lambrin-premium-wpc',
    name: 'Lambrin Premium WPC',
    slug: 'lambrin-premium-wpc',
    macroCategory: 'interior',
    description: 'Lambrines WPC de acabado premium.',
    count: 1
  },
  {
    id: 'interior-lambrin-irregular',
    name: 'Lambrin Irregular',
    slug: 'lambrin-irregular',
    macroCategory: 'interior',
    description: 'Textura irregular para acentos interiores.',
    count: 1
  },
  {
    id: 'interior-lambrin-wavy-max',
    name: 'Lambrin Wavy Max',
    slug: 'lambrin-wavy-max',
    macroCategory: 'interior',
    description: 'Perfil ondulado de formato alto.',
    count: 3
  },
  {
    id: 'exterior-lambrin-exterior',
    name: 'Lambrin Exterior',
    slug: 'lambrin-exterior',
    macroCategory: 'exterior',
    description: 'Lambrin para aplicaciones exteriores.',
    count: 1
  },
  {
    id: 'exterior-deck',
    name: 'Deck',
    slug: 'deck',
    macroCategory: 'exterior',
    description: 'Deck para piso exterior.',
    count: 1
  }
];

export const productPlaceholders: Product[] = [
  {
    name: 'Lambrin Wavy Max Brasilia',
    slug: 'lambrin-wavy-max-brasilia',
    categorySlug: 'lambrin-wavy-max',
    macroCategory: 'interior',
    summary: 'Placeholder temporal basado en el inventario Deco para validar el catalogo.',
    sku: 'DECO-LWM-BRA',
    variants: [
      {
        name: 'Lambrin Wavy Max',
        slug: 'lambrin-wavy-max',
        colors: [{ name: 'Brasilia', slug: 'brasilia', sku: 'DECO-LWM-BRA', status: 'complete' }]
      }
    ],
    featured: true,
    status: 'placeholder'
  },
  {
    name: 'Lambrin Wavy Max Gold Rio',
    slug: 'lambrin-wavy-max-gold-rio',
    categorySlug: 'lambrin-wavy-max',
    macroCategory: 'interior',
    summary: 'Placeholder temporal con imagen pendiente de auditoria en Drive.',
    sku: 'DECO-LWM-GRI',
    variants: [
      {
        name: 'Lambrin Wavy Max',
        slug: 'lambrin-wavy-max',
        colors: [{ name: 'Gold Rio', slug: 'gold-rio', sku: 'DECO-LWM-GRI', status: 'partial' }]
      }
    ],
    status: 'placeholder'
  },
  {
    name: 'Lambrin Wavy Max Roble Dorado',
    slug: 'lambrin-wavy-max-roble-dorado',
    categorySlug: 'lambrin-wavy-max',
    macroCategory: 'interior',
    summary: 'Placeholder temporal sin imagen final cargada.',
    sku: 'DECO-LWM-RDO',
    variants: [
      {
        name: 'Lambrin Wavy Max',
        slug: 'lambrin-wavy-max',
        colors: [{ name: 'Roble Dorado', slug: 'roble-dorado', sku: 'DECO-LWM-RDO', status: 'empty' }]
      }
    ],
    status: 'placeholder'
  },
  {
    name: 'Lambrin Premium WPC',
    slug: 'lambrin-premium-wpc',
    categorySlug: 'lambrin-premium-wpc',
    macroCategory: 'interior',
    summary: 'Producto temporal derivado de la estructura de inventario.',
    sku: 'DECO-LPW-001',
    variants: [{ name: 'Lambrin Premium WPC', slug: 'lambrin-premium-wpc', colors: [] }],
    status: 'placeholder'
  },
  {
    name: 'Lambrin Exterior Cepillado',
    slug: 'lambrin-exterior-cepillado',
    categorySlug: 'lambrin-exterior',
    macroCategory: 'exterior',
    summary: 'Producto temporal para validar categoria exterior.',
    sku: 'DECO-LEX-CEP',
    variants: [{ name: 'Cepillado', slug: 'cepillado', colors: [] }],
    status: 'placeholder'
  },
  {
    name: 'Deck Exterior',
    slug: 'deck-exterior',
    categorySlug: 'deck',
    macroCategory: 'exterior',
    summary: 'Producto temporal para validar grilla exterior.',
    sku: 'DECO-DEK-001',
    variants: [{ name: 'Deck', slug: 'deck', colors: [] }],
    status: 'placeholder'
  }
];
