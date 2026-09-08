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
  name: string;
  slug: string;
  sku?: string;
  image?: string;
  gallery?: string[];
  status?: ProductInventoryStatus;
};

export type ProductVariant = {
  name: string;
  slug: string;
  colors: ProductColor[];
};

export type Product = {
  name: string;
  slug: string;
  categorySlug: string;
  macroCategory: ProductMacroCategory;
  summary?: string;
  sku?: string;
  image?: string;
  gallery?: string[];
  variants: ProductVariant[];
  featured?: boolean;
  status?: ProductPublicationStatus;
};
