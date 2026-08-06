import { supabase } from './supabase';

export interface SystemSettings {
  brand_name: string;
  brand_logo: string;
  primary_color: string;
  contact_email: string;
  currency_symbol: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const defaultSettings: SystemSettings = {
    brand_name: 'Spinaz Garage',
    brand_logo: '',
    primary_color: '#EAB308',
    contact_email: 'soporte@spinaz.com',
    currency_symbol: '$',
  };

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value');

    if (error || !data) {
      return defaultSettings;
    }

    const settings: any = {};
    data.forEach((item) => {
      settings[item.key] = item.value;
    });

    return {
      brand_name: settings.brand_name || defaultSettings.brand_name,
      brand_logo: settings.brand_logo || defaultSettings.brand_logo,
      primary_color: settings.primary_color || defaultSettings.primary_color,
      contact_email: settings.contact_email || defaultSettings.contact_email,
      currency_symbol: settings.currency_symbol || defaultSettings.currency_symbol,
    };
  } catch (err) {
    return defaultSettings;
  }
}
