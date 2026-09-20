import { supabase } from '../lib/supabase';

export const fallbackWhatsappNumber = '9931595909';

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
