import { supabase } from './supabase';

export interface SystemSettings {
  brand_name: string;
  brand_logo: string;
  primary_color: string;
  contact_email: string;
  currency_symbol: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value');

  if (error) {
    console.error('Error fetching system settings:', error);
    return {
      brand_name: 'Spinaz Garage',
      brand_logo: '',
      primary_color: '#EAB308',
      contact_email: 'soporte@spinaz.com',
      currency_symbol: '$',
    };
  }

  const settings: any = {};
  data.forEach((item) => {
    settings[item.key] = item.value;
  });

  return {
    brand_name: settings.brand_name || 'Spinaz Garage',
    brand_logo: settings.brand_logo || '',
    primary_color: settings.primary_color || '#EAB308',
    contact_email: settings.contact_email || 'soporte@spinaz.com',
    currency_symbol: settings.currency_symbol || '$',
  };
}
