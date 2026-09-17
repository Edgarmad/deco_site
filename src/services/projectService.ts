import { projectPlaceholders } from '../data/projects';
import type { Project } from '../types/projects';

type WpRendered = { rendered?: string };
type WpProject = {
  slug: string;
  title?: WpRendered;
  excerpt?: WpRendered;
  project_details?: Partial<Project>;
  main_image_url?: string;
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

const normalizeWpProject = (project: WpProject): Project => {
  const details = project.project_details ?? {};

  return {
    name: details.name ?? stripHtml(project.title?.rendered) ?? project.slug,
    slug: project.slug,
    category: details.category ?? 'Proyecto',
    description: details.description ?? stripHtml(project.excerpt?.rendered),
    visual: details.visual ?? 'wood-stripes',
    imageAlt: details.imageAlt ?? `Proyecto ${details.name ?? project.slug}`,
    featured: details.featured,
    location: details.location ?? 'Por definir',
    year: details.year ?? 'Por definir',
    surface: details.surface ?? 'Por definir',
    materials: details.materials ?? [],
    challenge: details.challenge ?? '',
    result: details.result ?? ''
  };
};

export const getProjects = async (): Promise<Project[]> => {
  const apiUrl = getWordPressApiUrl();
  if (!apiUrl) return projectPlaceholders;

  const wpProjects = await fetchJson<WpProject[]>(`${apiUrl}/wp-json/wp/v2/projects?_embed`);
  return wpProjects?.map(normalizeWpProject) ?? projectPlaceholders;
};

export const getProjectBySlug = async (slug: string): Promise<Project | undefined> => {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug);
};
