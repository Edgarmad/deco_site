export const parseHomeCovers = (value: string): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([key, item]) =>
      /^[a-z0-9-]+$/.test(key) && typeof item === 'string' && /^[a-z0-9-]+$/.test(item)
    ));
  } catch { return {}; }
};

export const getCatalogAreas = (categorySlug: string, area: string): string[] =>
  categorySlug === 'accesorios' ? ['interior', 'exterior'] : [area];
