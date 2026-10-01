import type { Product } from '../types/products.ts';

// La misma selección se usa en el administrador y en el servicio público.
export function selectProductMedia<T extends { id?: string; kind: string; sort_order: number | null }>(images: T[]) {
  const ordered = images.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.id ?? '').localeCompare(b.id ?? ''));
  const main = ordered.find(image => image.kind === 'main') ?? ordered.find(image => image.kind !== 'swatch') ?? ordered[0];
  const swatch = ordered.find(image => image.kind === 'swatch') ?? main;
  const secondary = ordered.find(image => image.kind === 'secondary' && image !== main);
  const gallery = ordered.filter(image => image !== main && image.kind !== 'swatch');
  return { main, swatch, secondary, gallery: secondary ? [secondary, ...gallery.filter(image => image !== secondary)] : gallery };
}

export type GalleryProduct = Pick<Product, 'image' | 'imageAlt' | 'name' | 'galleryImages' | 'gallery' | 'supportFiles' | 'technicalSupportFileId'>;
export function getProductGallery(product: GalleryProduct, documentsVisible = true) {
  const photos = (product.galleryImages ?? (product.gallery ?? []).map(url => ({ url, alt: product.name }))).filter(image => image.url && image.url !== product.image);
  const files = documentsVisible ? (product.supportFiles ?? []).filter(file => file.url) : [];
  const technicalFile = files.find(file => file.id === product.technicalSupportFileId);
  const items: { url: string; alt: string; document?: boolean }[] = [...photos];
  if (technicalFile) {
    if (!items.length && product.image) items.push({ url: product.image, alt: product.imageAlt ?? product.name });
    items.splice(Math.min(1, items.length), 0, { url: technicalFile.url, alt: `Ficha técnica: ${technicalFile.title}`, document: true });
  }
  return { items, otherFiles: files.filter(file => file !== technicalFile) };
}

export function parseMediaMetadata(form: FormData, kinds: string[]) {
  const kind = String(form.get('kind') ?? 'gallery');
  const sort_order = Number(form.get('sort_order') || 0);
  if (!kinds.includes(kind) || !Number.isInteger(sort_order) || Math.abs(sort_order) > 2147483647) throw new Error('Tipo u orden de imagen inválido.');
  return { kind, sort_order, alt_text: String(form.get('alt_text') ?? '').trim().slice(0, 1000) };
}
