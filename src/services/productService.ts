import { productCategories, productPlaceholders } from '../data/products';
import type { Product, ProductCategory, ProductMacroCategory } from '../types/products';

type WpRendered = { rendered?: string };
type WpTerm = {
  id: number;
  name: string;
  slug: string;
  count?: number;
  category_details?: { macroCategory?: ProductMacroCategory; description?: string };
};
type WpProduct = {
  slug: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  product_details?: Partial<Product>;
  main_image_url?: string;
  gallery_urls?: string[];
};

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '').trim();

const getWordPressApiUrl = () => {
  const rawUrl = import.meta.env.WORDPRESS_API_URL;
  return typeof rawUrl === 'string' && rawUrl.trim().length > 0 ? rawUrl.replace(/\/$/, '') : '';
};

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const normalizeWpCategory = (category: WpTerm): ProductCategory => ({
  id: String(category.id),
  name: category.name,
  slug: category.slug,
  macroCategory: category.category_details?.macroCategory ?? 'interior',
  description: category.category_details?.description,
  count: category.count
});

const normalizeWpProduct = (product: WpProduct): Product => ({
  name: product.product_details?.name ?? stripHtml(product.title?.rendered) ?? product.slug,
  slug: product.slug,
  categorySlug: product.product_details?.categorySlug ?? '',
  macroCategory: product.product_details?.macroCategory ?? 'interior',
  summary: product.product_details?.summary ?? stripHtml(product.excerpt?.rendered),
  sku: product.product_details?.sku,
  image: product.product_details?.image ?? product.main_image_url,
  gallery: product.product_details?.gallery ?? product.gallery_urls,
  variants: product.product_details?.variants ?? [],
  featured: product.product_details?.featured,
  status: product.product_details?.status ?? 'published'
});

export const getProducts = async (): Promise<Product[]> => {
  const apiUrl = getWordPressApiUrl();
  if (!apiUrl) return productPlaceholders;

  const wpProducts = await fetchJson<WpProduct[]>(`${apiUrl}/wp-json/wp/v2/products?_embed`);
  return wpProducts?.map(normalizeWpProduct) ?? productPlaceholders;
};

export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const apiUrl = getWordPressApiUrl();
  if (!apiUrl) return productCategories;

  const wpCategories = await fetchJson<WpTerm[]>(`${apiUrl}/wp-json/wp/v2/product_category?hide_empty=false`);
  return wpCategories?.map(normalizeWpCategory) ?? productCategories;
};

export const getProductBySlug = async (slug: string): Promise<Product | undefined> => {
  const products = await getProducts();
  return products.find((product) => product.slug === slug);
};
