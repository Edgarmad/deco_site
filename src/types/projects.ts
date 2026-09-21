export type ProjectVisual = 'wood-stripes' | 'paper-lines' | 'dark-diagonal';

export type Project = {
  name: string;
  slug: string;
  category: string;
  description: string;
  visual: ProjectVisual;
  imageAlt: string;
  image?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  gallery?: { url: string; alt: string; kind: string }[];
  featured?: boolean;
  location: string;
  year: string;
  surface: string;
  materials: string[];
  challenge: string;
  result: string;
};
