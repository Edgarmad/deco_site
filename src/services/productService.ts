import { productCategories, productPlaceholders } from '../data/products';
import type { Product, ProductCategory, ProductMacroCategory } from '../types/products';
import { getPublicStorageUrl, supabase } from '../lib/supabase';

type SupabaseCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  products?: { count: number }[];
};

type ProductImageRow = {
  storage_bucket: string;
  storage_path: string;
  kind: 'main' | 'secondary' | 'gallery' | 'extra' | 'technical';
  sort_order: number | null;
  alt_text: string | null;
};

type ProductOptionRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  color_name: string | null;
  color_hex: string | null;
  price: number | null;
  summary: string | null;
  description: string | null;
  dimensions: string | null;
  thickness: string | null;
  material: string | null;
  usage: string | null;
  installation_notes: string | null;
  care_notes: string | null;
  technical_specs: Record<string, string | number | null> | null;
  technical_sheet_url: string | null;
  installation_guide_url: string | null;
  section_visibility: Record<string, boolean> | null;
  fallback_image_path: string | null;
  featured: boolean | null;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  canonical_path: string | null;
  faq_items: Record<string, string | number | null> | null;
  finish: string | null;
  product_images?: ProductImageRow[];
  product_variants: {
    id: string;
    name: string;
    slug: string;
    summary: string | null;
    description: string | null;
    products: {
      id: string;
      name: string;
      slug: string;
      summary: string | null;
      description: string | null;
      categories: {
        id: string;
        name: string;
        slug: ProductMacroCategory;
      } | null;
    } | null;
  } | null;
};

const normalizeCategory = (category: SupabaseCategory): ProductCategory => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  macroCategory: category.slug === 'interior' ? 'interior' : 'exterior',
  description: category.description ?? undefined,
  count: category.products?.[0]?.count
});

const normalizeOption = (option: ProductOptionRow): Product | null => {
  const variant = option.product_variants;
  const product = variant?.products;
  const category = product?.categories;
  if (!variant || !product || !category) return null;

  const images = (option.product_images ?? [])
    .slice()
    .sort((first, second) => (first.sort_order ?? 0) - (second.sort_order ?? 0));
  const mainImage = images.find((image) => image.kind === 'main') ?? images[0];
  const fallbackImage = getPublicStorageUrl('site-media', option.fallback_image_path ?? '');
  const secondaryImage = images.find((image) => image.kind === 'secondary');
  const gallery = images
    .filter((image) => image !== mainImage)
    .map((image) => getPublicStorageUrl(image.storage_bucket, image.storage_path))
    .filter((image): image is string => Boolean(image));
  const variantDisplayName = variant.name.trim().toLowerCase() === 'general' ? product.name : variant.name;

  return {
    id: option.id,
    name: `${product.name} ${option.name}`.trim(),
    slug: option.slug,
    categorySlug: product.slug,
    categoryName: product.name,
    macroCategory: category.slug === 'interior' ? 'interior' : 'exterior',
    summary: option.summary ?? variant.summary ?? product.summary ?? undefined,
    description: option.description ?? variant.description ?? product.description ?? undefined,
    sku: option.sku ?? undefined,
    price: option.price ?? undefined,
    image: getPublicStorageUrl(mainImage?.storage_bucket ?? '', mainImage?.storage_path) ?? fallbackImage,
    secondaryImage: getPublicStorageUrl(secondaryImage?.storage_bucket ?? '', secondaryImage?.storage_path),
    gallery,
    imageAlt: mainImage?.alt_text ?? undefined,
    galleryImages: images.filter(image => image !== mainImage).map(image => ({ url: getPublicStorageUrl(image.storage_bucket, image.storage_path) ?? '', alt: image.alt_text ?? option.name })),
    canonicalPath: option.canonical_path ?? undefined,
    faqItems: option.faq_items ?? {},
    finish: option.finish ?? undefined,
    variants: [
      {
        id: variant.id,
        name: variantDisplayName,
        slug: variant.slug,
        colors: [
          {
            id: option.id,
            name: option.color_name ?? option.name,
            hex: option.color_hex ?? undefined,
            slug: option.slug,
            sku: option.sku ?? undefined,
            status: 'complete'
          }
        ]
      }
    ],
    featured: option.featured ?? false,
    status: option.status,
    seoTitle: option.seo_title ?? undefined,
    seoDescription: option.seo_description ?? undefined,
    dimensions: option.dimensions ?? undefined,
    thickness: option.thickness ?? undefined,
    material: option.material ?? undefined,
    usage: option.usage ?? undefined,
    installationNotes: option.installation_notes ?? undefined,
    careNotes: option.care_notes ?? undefined,
    technicalSpecs: option.technical_specs ?? undefined,
    technicalSheetUrl: option.technical_sheet_url ?? undefined,
    installationGuideUrl: option.installation_guide_url ?? undefined,
    sectionVisibility: option.section_visibility ?? undefined
  };
};

const normalizeLabel = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const catalogFamilies = [
  { slug: 'lambrin-asa', name: 'Lambrin ASA', matches: ['lambrin exterior', 'lambrin asa'] },
  { slug: 'lambrin', name: 'Lambrin', matches: ['panel lambrin wpc', 'lambrin premium', 'lambrin irregular', 'lambrin wavy max', 'lambrin'] },
  { slug: 'panel-reforzado-spc', name: 'Panel Reforzado SPC', matches: ['panel reforzado'] },
  { slug: 'plafon-pvc', name: 'Plafon PVC', matches: ['panel techo spc', 'plafon pvc'] },
  { slug: 'placas-marmol-pvc', name: 'Placas Marmol PVC', matches: ['placas marmol', 'placas tipo marmol'] },
  { slug: 'vigas-wpc', name: 'Vigas WPC', matches: ['vigas interior', 'vigas wpc'] },
  { slug: 'piso-spc', name: 'Piso SPC', matches: ['pisos spc', 'piso spc'] },
  { slug: 'wall-cladding-asa', name: 'Wall Cladding ASA', matches: ['wallcladding', 'wall cladding'] },
  { slug: 'deck-coextruido', name: 'Deck Coextruido', matches: ['deck'] },
  { slug: 'viga-coextruida', name: 'Viga Coextruida', matches: ['viga exterior', 'viga coextruida'] }
];

const catalogVariantNames: Record<string, string> = {
  'lambrin premium wpc': 'Lambrin Premium 4',
  'lambrin premium 3 max': 'Lambrin Max 3'
};

const getCatalogFamily = (product: Product) => {
  const label = normalizeLabel(product.categoryName ?? product.categorySlug.replaceAll('-', ' '));
  return catalogFamilies.find((family) => family.matches.some((match) => label.includes(match))) ?? {
    slug: product.categorySlug,
    name: product.categoryName ?? product.categorySlug
  };
};

export const groupProductsByVariant = (products: Product[]): Product[] => {
  const grouped = new Map<string, Product>();

  products.forEach((product) => {
    const variant = product.variants[0];
    if (!variant) return;

    const key = variant.id ?? `${product.categorySlug}:${variant.slug}`;
    const existing = grouped.get(key);
    if (!existing) {
      const family = getCatalogFamily(product);
      const variantName = catalogVariantNames[normalizeLabel(variant.name)] ?? variant.name;
      grouped.set(key, {
        ...product,
        name: variantName,
        categorySlug: family.slug,
        categoryName: family.name,
        variants: [{ ...variant, name: variantName, colors: [...variant.colors] }]
      });
      return;
    }

    const existingVariant = existing.variants[0];
    const knownColors = new Set(existingVariant.colors.map((color) => color.id ?? color.slug));
    existingVariant.colors.push(
      ...variant.colors.filter((color) => !knownColors.has(color.id ?? color.slug))
    );
  });

  return Array.from(grouped.values());
};

const productOptionSelect = `
  id,name,slug,sku,price,summary,description,dimensions,thickness,material,usage,installation_notes,care_notes,technical_specs,technical_sheet_url,installation_guide_url,section_visibility,fallback_image_path,featured,status,seo_title,seo_description,
  canonical_path,faq_items,finish,color_name,color_hex,
  product_images(storage_bucket,storage_path,kind,sort_order,alt_text),
  product_variants(id,name,slug,summary,description,products(id,name,slug,summary,description,categories(id,name,slug)))
`;

export const getProducts = async (): Promise<Product[]> => {
  if (!supabase) return productPlaceholders;

  const { data, error } = await supabase
    .from('product_options')
    .select(productOptionSelect)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  return (data as unknown as ProductOptionRow[]).map(normalizeOption).filter((product): product is Product => Boolean(product));
};

export const getCatalogProducts = async (): Promise<Product[]> => {
  return groupProductsByVariant(await getProducts());
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  if (!supabase) return productCategories;

  const { data, error } = await supabase
    .from('categories')
    .select('id,name,slug,description,products(count)')
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las categorías: ${error.message}`);
  return (data as unknown as SupabaseCategory[]).map(normalizeCategory);
};

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  if (!supabase) return productPlaceholders.find((product) => product.slug === slug);

  const { data, error } = await supabase
    .from('product_options')
    .select(productOptionSelect)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`No se pudo consultar el producto: ${error.message}`);
  if (!data) return undefined;
  return normalizeOption(data as unknown as ProductOptionRow) ?? undefined;
};
