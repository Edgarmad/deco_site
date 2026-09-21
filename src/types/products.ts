export type ProductMacroCategory = string;

export type ProductPublicationStatus = 'draft' | 'published' | 'placeholder';

export type ProductInventoryStatus = 'empty' | 'partial' | 'complete';

export type ProductCalculatorConfig =
  | {
      mode: 'area';
      coverage: number;
      coverageUnit: 'm²';
      piecesPerPresentation?: number;
      presentationLabel?: string;
    }
  | {
      mode: 'linear';
      pieceLengthMeters: number;
      piecesPerPresentation?: number;
      presentationLabel?: string;
    };

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  macroCategory: ProductMacroCategory;
  description?: string;
  count?: number;
};

export type ProductColor = {
  hex?: string;
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
  price?: number;
  image?: string;
  secondaryImage?: string;
  imageAlt?: string;
  galleryImages?: { url: string; alt: string }[];
  canonicalPath?: string;
  faqItems?: Record<string, string | number | null>;
  finish?: string;
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
  technicalSpecs?: Record<string, string | number | null>;
  technicalSheetUrl?: string;
  installationGuideUrl?: string;
  sectionVisibility?: Record<string, boolean>;
  calculator?: ProductCalculatorConfig;
};
