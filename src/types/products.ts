export type ProductMacroCategory = 'interior' | 'exterior';

export type ProductPublicationStatus = 'draft' | 'published' | 'placeholder';

export type ProductInventoryStatus = 'empty' | 'partial' | 'complete';

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  macroCategory: ProductMacroCategory;
  description?: string;
  count?: number;
};

export type ProductColor = {
  id?: string;
  name: string;
  slug: string;
  sku?: string;
  image?: string;
  gallery?: string[];
  status?: ProductInventoryStatus;
};

export type ProductVariant = {
  id?: string;
  name: string;
  slug: string;
  colors: ProductColor[];
};

export type Product = {
  id?: string;
  name: string;
  slug: string;
  categorySlug: string;
  categoryName?: string;
  macroCategory: ProductMacroCategory;
  summary?: string;
  description?: string;
  sku?: string;
  image?: string;
  secondaryImage?: string;
  gallery?: string[];
  variants: ProductVariant[];
  featured?: boolean;
  status?: ProductPublicationStatus;
  seoTitle?: string;
  seoDescription?: string;
  dimensions?: string;
  thickness?: string;
  material?: string;
  usage?: string;
  installationNotes?: string;
  careNotes?: string;
};
