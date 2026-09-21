import { projectPlaceholders } from '../data/projects';
import type { Project } from '../types/projects';
import { getPublicStorageUrl, supabase } from '../lib/supabase';

type SupabaseProject = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  category: string | null;
  location: string | null;
  year: string | null;
  surface: string | null;
  materials: string[] | null;
  challenge: string | null;
  result: string | null;
  featured: boolean | null;
  seo_title: string | null;
  seo_description: string | null;
  project_images?: {
    storage_bucket: string;
    storage_path: string;
    alt_text: string | null;
    kind: 'main' | 'gallery' | 'before' | 'after';
    sort_order: number | null;
  }[];
};

const normalizeProject = (project: SupabaseProject): Project => {
  const images = (project.project_images ?? [])
    .slice()
    .sort((first, second) => (first.sort_order ?? 0) - (second.sort_order ?? 0));
  const mainImage = images.find((image) => image.kind === 'main') ?? images[0];

  return {
    name: project.title,
    content: project.content ?? undefined,
    seoTitle: project.seo_title ?? undefined,
    seoDescription: project.seo_description ?? undefined,
    gallery: images.filter(image => image !== mainImage).map(image => ({ url: getPublicStorageUrl(image.storage_bucket, image.storage_path) ?? '', alt: image.alt_text ?? project.title, kind: image.kind })),
    slug: project.slug,
    category: project.category ?? 'Proyecto',
    description: project.summary ?? project.content ?? '',
    visual: 'wood-stripes',
    imageAlt: mainImage?.alt_text ?? `Proyecto ${project.title}`,
    featured: project.featured ?? false,
    location: project.location ?? 'Por definir',
    year: project.year ?? 'Por definir',
    surface: project.surface ?? 'Por definir',
    materials: project.materials ?? [],
    challenge: project.challenge ?? '',
    result: project.result ?? '',
    image: getPublicStorageUrl(mainImage?.storage_bucket ?? '', mainImage?.storage_path)
  };
};

const projectSelect = `
  id,title,slug,summary,content,category,location,year,surface,materials,challenge,result,featured,seo_title,seo_description,
  project_images(storage_bucket,storage_path,alt_text,kind,sort_order)
`;

export const getProjects = async (): Promise<Project[]> => {
  if (!supabase) return projectPlaceholders;

  const { data, error } = await supabase
    .from('projects')
    .select(projectSelect)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los proyectos: ${error.message}`);
  if (!data?.length) return projectPlaceholders;
  return (data as unknown as SupabaseProject[]).map(normalizeProject);
};

export const getProjectBySlug = async (slug: string): Promise<Project | undefined> => {
  if (!supabase) return projectPlaceholders.find((project) => project.slug === slug);

  const { data, error } = await supabase
    .from('projects')
    .select(projectSelect)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`No se pudo consultar el proyecto: ${error.message}`);
  if (!data) return undefined;
  return normalizeProject(data as unknown as SupabaseProject);
};
