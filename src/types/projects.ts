export type ProjectVisual = 'wood-stripes' | 'paper-lines' | 'dark-diagonal';

export type Project = {
  name: string;
  slug: string;
  category: string;
  description: string;
  visual: ProjectVisual;
  imageAlt: string;
  featured?: boolean;
  location: string;
  year: string;
  surface: string;
  materials: string[];
  challenge: string;
  result: string;
};
