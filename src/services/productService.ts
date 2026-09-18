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
};

type ProductOptionRow = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  summary: string | null;
  description: string | null;
  dimensions: string | null;
  thickness: string | null;
  material: string | null;
  usage: string | null;
  installation_notes: string | null;
  care_notes: string | null;
  featured: boolean | null;
  status: 'draft' | 'published';
  seo_title: string | null;
  seo_description: string | null;
  product_images?: ProductImageRow[];
  product_variants: {
    id: string;
    name: string;
    slug: string;
    products: {
      id: string;
      name: string;
      slug: string;
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
  macroCategory: category.slug === 'exterior' ? 'exterior' : 'interior',
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
  const gallery = images
    .filter((image) => image !== mainImage)
    .map((image) => getPublicStorageUrl(image.storage_bucket, image.storage_path))
    .filter((image): image is string => Boolean(image));

  return {
    id: option.id,
    name: `${product.name} ${option.name}`.trim(),
    slug: option.slug,
    categorySlug: product.slug,
    macroCategory: category.slug === 'exterior' ? 'exterior' : 'interior',
    summary: option.summary ?? undefined,
    description: option.description ?? undefined,
    sku: option.sku ?? undefined,
    image: getPublicStorageUrl(mainImage?.storage_bucket ?? '', mainImage?.storage_path),
    gallery,
    variants: [
      {
        id: variant.id,
        name: variant.name,
        slug: variant.slug,
        colors: [
          {
            id: option.id,
            name: option.name,
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
    careNotes: option.care_notes ?? undefined
  };
};

const productOptionSelect = `
  id,name,slug,sku,summary,description,dimensions,thickness,material,usage,installation_notes,care_notes,featured,status,seo_title,seo_description,
  product_images(storage_bucket,storage_path,kind,sort_order),
  product_variants(id,name,slug,products(id,name,slug,categories(id,name,slug)))
`;

export const getProducts = async (): Promise<Product[]> => {
  if (!supabase) return productPlaceholders;

  const { data, error } = await supabase
    .from('product_options')
    .select(productOptionSelect)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });

  if (error || !data?.length) return productPlaceholders;
  return (data as unknown as ProductOptionRow[]).map(normalizeOption).filter((product): product is Product => Boolean(product));
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  if (!supabase) return productCategories;

  const { data, error } = await supabase
    .from('categories')
    .select('id,name,slug,description,products(count)')
    .eq('status', 'published')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) return productCategories;
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

  if (error || !data) return undefined;
  return normalizeOption(data as unknown as ProductOptionRow) ?? undefined;
};
