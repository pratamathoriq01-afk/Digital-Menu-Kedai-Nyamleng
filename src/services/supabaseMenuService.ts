import { supabase } from '@/lib/supabaseClient';
import { MenuItem, AddOnOption, AddOnGroup, StoreSettings, VariantGroup } from '@/types/pos';

// Mapping kategori Kasir App → slug yang digunakan di Menu Digital
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'menu ayam nyamleng': 'ayam-nyamleng',
  'menu ikan nyamleng': 'ikan-nyamleng',
  'menu minuman': 'minuman',
  'menu alacarte': 'alacarte',
  'cemilan & snack': 'snack',
  'cemilan dan snack': 'snack',
  'paket hemat': 'paket-hemat',
  // Fallback generic
  'makanan': 'makanan',
  'minuman': 'minuman',
  'cemilan': 'snack',
  'dessert': 'dessert',
};

export const mapCategoryToSlug = (rawCategory: string): string => {
  const lower = (rawCategory || '').toLowerCase().trim();
  if (CATEGORY_SLUG_MAP[lower]) return CATEGORY_SLUG_MAP[lower];
  if (lower.includes('ayam')) return 'ayam-nyamleng';
  if (lower.includes('ikan')) return 'ikan-nyamleng';
  if (lower.includes('minum')) return 'minuman';
  if (lower.includes('alacarte') || lower.includes('ala carte')) return 'alacarte';
  if (lower.includes('cemil') || lower.includes('snack')) return 'snack';
  if (lower.includes('paket') || lower.includes('hemat')) return 'paket-hemat';
  if (lower.includes('dessert')) return 'dessert';
  return 'makanan';
};

// Default fallback StoreSettings
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'default',
  storeName: 'Kedai Nyamleng',
  address: 'Jl. Laksada Adi Sucipto Gg.14 No 42, Kelurahan Blimbing, Kecamatan Blimbing, Kota Malang, Jawa Timur',
  whatsapp: '085113661387',
  city: 'Kota Malang',
  province: 'Jawa Timur',
  isOpen: true,
  openTime: '08:00',
  closeTime: '22:00',
  isAutoSchedule: true,
  closedReason: 'Kedai sedang istirahat / tutup sementara.',
};

/**
 * Fetch Store Settings (Operating Hours, Open/Closed Switch, Status Message)
 */
export const fetchSupabaseStoreSettings = async (): Promise<StoreSettings> => {
  try {
    const { data, error } = await supabase
      .from('StoreSettings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) {
      console.warn('[Supabase StoreSettings Fetch Error / Empty]:', error?.message);
      return DEFAULT_STORE_SETTINGS;
    }

    return {
      id: data.id || 'default',
      storeName: data.storeName || DEFAULT_STORE_SETTINGS.storeName,
      address: data.address || DEFAULT_STORE_SETTINGS.address,
      whatsapp: data.whatsapp || DEFAULT_STORE_SETTINGS.whatsapp,
      city: data.city || DEFAULT_STORE_SETTINGS.city,
      province: data.province || DEFAULT_STORE_SETTINGS.province,
      isOpen: data.isOpen !== undefined ? Boolean(data.isOpen) : true,
      openTime: data.openTime || '08:00',
      closeTime: data.closeTime || '22:00',
      isAutoSchedule: data.isAutoSchedule !== undefined ? Boolean(data.isAutoSchedule) : true,
      closedReason: data.closedReason || DEFAULT_STORE_SETTINGS.closedReason,
      updatedAt: data.updatedAt,
    };
  } catch (err) {
    console.error('[Supabase StoreSettings Exception]:', err);
    return DEFAULT_STORE_SETTINGS;
  }
};

/**
 * Update Store Settings in Supabase
 */
export const updateSupabaseStoreSettings = async (settings: Partial<StoreSettings>): Promise<boolean> => {
  try {
    const payload = {
      id: 'default',
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('StoreSettings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase StoreSettings Update Error]:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase StoreSettings Update Exception]:', err);
    return false;
  }
};

export const fetchSupabaseMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('MenuItem')
      .select('*')
      .eq('isActive', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.warn('[Supabase Menu Fetch Error]:', error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch all active add-ons from Supabase
    const { data: addOnsData } = await supabase
      .from('AddOn')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    const allAddOns: any[] = addOnsData || [];

    const mappedItems: MenuItem[] = data.map((item: any) => {
      const categorySlug = mapCategoryToSlug(item.category || '');

      // Match AddOns for this menu item
      const matchingAddOns = allAddOns.filter((addon) => {
        if (!addon.isActive) return false;
        if (!addon.category || addon.category === 'Semua') return true;
        return addon.category === item.category;
      });

      // Build Add-On group
      const addOnGroups: AddOnGroup[] = matchingAddOns.length > 0 ? [
        {
          id: 'addon-group-1',
          name: 'Pilihan Tambahan / Topping',
          maxSelect: matchingAddOns.length,
          options: matchingAddOns.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: Number(addon.price || 0),
          } as AddOnOption)),
        },
      ] : [];

      // Smart Default Variant Groups based on Category
      const isDrink = categorySlug === 'minuman';
      const isFood = ['ayam-nyamleng', 'ikan-nyamleng', 'alacarte', 'makanan', 'paket-hemat'].includes(categorySlug);

      const variantGroups: VariantGroup[] = [];

      if (isFood) {
        variantGroups.push({
          id: 'var-pedas',
          name: 'Level Kepedasan Sambal',
          required: true,
          options: [
            { id: 'p1', name: 'Level 1: Sedang', priceModifier: 0 },
            { id: 'p2', name: 'Level 2: Pedas Nyamleng (Favorit)', priceModifier: 0 },
            { id: 'p3', name: 'Level 3: Ekstra Pedas Gila', priceModifier: 2000 },
          ],
        });
      } else if (isDrink) {
        variantGroups.push({
          id: 'var-suhu',
          name: 'Suhu Minuman',
          required: true,
          options: [
            { id: 'd1', name: 'Es Dingin Segar', priceModifier: 0 },
            { id: 'd2', name: 'Hangat / Panas', priceModifier: 0 },
            { id: 'd3', name: 'Suhu Normal (Tanpa Es)', priceModifier: 0 },
          ],
        });
      }

      return {
        id: item.id,
        posSku: item.id ? item.id.slice(-6).toUpperCase() : 'SKU-001',
        name: item.name,
        description: item.description || `Menu pilihan khas Kedai Nyamleng - ${item.name}.`,
        price: Number(item.price),
        categoryId: categorySlug,
        image: item.imageUrl || getFallbackImage(categorySlug),
        tags: ['Terlaris'],
        isAvailable: item.isActive,
        preparationTimeMinutes: 7,
        variantGroups,
        addOnGroups,
        _rawCategory: item.category,
      } as MenuItem & { _rawCategory: string };
    });

    return mappedItems;
  } catch (err) {
    console.error('[Supabase Menu Exception]:', err);
    return [];
  }
};

const getFallbackImage = (categorySlug: string): string => {
  const images: Record<string, string> = {
    'ayam-nyamleng': 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?auto=format&fit=crop&q=80&w=800',
    'ikan-nyamleng': 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800',
    'minuman': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800',
    'alacarte': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800',
    'snack': 'https://images.unsplash.com/photo-1576866209830-589e1bfbaa4d?auto=format&fit=crop&q=80&w=800',
    'paket-hemat': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
    'dessert': 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=800',
    'makanan': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
  };
  return images[categorySlug] || images['makanan'];
};

export const fetchSupabaseVouchers = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('Voucher')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error || !data) {
      console.warn('[Supabase Vouchers Fetch Error]:', error?.message);
      return [];
    }

    return data.map((v: any) => ({
      id: v.id,
      code: String(v.code || '').trim().toUpperCase(),
      title: v.title || v.code,
      description: v.description || 'Voucher Promo Digital Kedai Nyamleng',
      discountType: String(v.discountType || '').toUpperCase().includes('FIXED') ? 'FIXED' : 'PERCENTAGE',
      discountValue: Number(v.discountValue || 0),
      minSubtotal: Number(v.minSubtotal || 0),
      maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : undefined,
      validUntil: v.validUntil || '2026-12-31',
      isActive: v.isActive ?? true,
    }));
  } catch (err) {
    console.error('[Supabase Vouchers Exception]:', err);
    return [];
  }
};

export const fetchSupabaseAddOns = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('AddOn')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase AddOns Fetch Error]:', error?.message);
      return [];
    }
    return data;
  } catch (err) {
    console.error('[Supabase AddOns Exception]:', err);
    return [];
  }
};
