import { supabase } from '../lib/supabase';

export const fallbackWhatsappNumber = '9931595909';
export const fallbackHomeHeroVideoUrl = '/assets/videos/header-hero.mp4';

export type ProductSectionVisibility = {
  technical: boolean;
  support: boolean;
  faq: boolean;
  installation: boolean;
};

export const defaultProductSectionVisibility: ProductSectionVisibility = {
  technical: true,
  support: true,
  faq: true,
  installation: true
};

export const getProductSectionVisibility = async (): Promise<ProductSectionVisibility> => {
  if (!supabase) return defaultProductSectionVisibility;

  const keys = {
    technical: 'product_section_technical_enabled',
    support: 'product_section_support_enabled',
    faq: 'product_section_faq_enabled',
    installation: 'product_section_installation_enabled'
  } as const;
  const { data } = await supabase.from('site_settings').select('key,value').in('key', Object.values(keys));
  const values = new Map((data ?? []).map((item) => [item.key, item.value === 'true']));

  return {
    technical: values.get(keys.technical) ?? true,
    support: values.get(keys.support) ?? true,
    faq: values.get(keys.faq) ?? true,
    installation: values.get(keys.installation) ?? true
  };
};

const normalizeWhatsappNumber = (value: string) => value.replace(/\D/g, '');

const getWhatsappInternationalNumber = (value: string) => {
  const digits = normalizeWhatsappNumber(value);
  return digits.length === 10 ? `52${digits}` : digits;
};

export const getWhatsappNumber = async () => {
  if (!supabase) return fallbackWhatsappNumber;

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'whatsapp_number')
    .maybeSingle();

  if (error || !data?.value) return fallbackWhatsappNumber;
  return normalizeWhatsappNumber(data.value) || fallbackWhatsappNumber;
};

export const getWhatsappUrl = async () => `https://wa.me/${getWhatsappInternationalNumber(await getWhatsappNumber())}`;

const isValidPublicVideoUrl = (value: string) => {
  if (value.startsWith('/')) return value.split('?')[0].endsWith('.mp4');
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && url.pathname.endsWith('.mp4');
  } catch { return false; }
};

export const getHomeHeroVideoUrl = async () => {
  if (!supabase) return fallbackHomeHeroVideoUrl;

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'home_hero_video_url')
    .maybeSingle();

  const value = data?.value?.trim() ?? '';
  if (error || !isValidPublicVideoUrl(value)) return fallbackHomeHeroVideoUrl;
  return value;
};
