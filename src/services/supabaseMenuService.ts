import { supabase } from '@/lib/supabaseClient';
import { MenuItem, AddOnOption, AddOnGroup } from '@/types/pos';

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
  // Direct match
  if (CATEGORY_SLUG_MAP[lower]) return CATEGORY_SLUG_MAP[lower];
  // Partial match fallback
  if (lower.includes('ayam')) return 'ayam-nyamleng';
  if (lower.includes('ikan')) return 'ikan-nyamleng';
  if (lower.includes('minum')) return 'minuman';
  if (lower.includes('alacarte') || lower.includes('ala carte')) return 'alacarte';
  if (lower.includes('cemil') || lower.includes('snack')) return 'snack';
  if (lower.includes('paket') || lower.includes('hemat')) return 'paket-hemat';
  if (lower.includes('dessert')) return 'dessert';
  return 'makanan'; // default fallback
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

    // Fetch all active add-ons from Supabase to attach to menu items
    const { data: addOnsData } = await supabase
      .from('AddOn')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    const allAddOns: any[] = addOnsData || [];

    const mappedItems: MenuItem[] = data.map((item: any) => {
      const categorySlug = mapCategoryToSlug(item.category || '');

      // Filter add-ons applicable to this menu item:
      // "Semua" matches all, or category matches exactly
      const matchingAddOns = allAddOns.filter((addon) => {
        if (!addon.isActive) return false;
        if (!addon.category || addon.category === 'Semua') return true;
        return addon.category === item.category;
      });

      // Build addOnGroups from Supabase AddOn data (flat list → single group)
      const addOnGroups: AddOnGroup[] = matchingAddOns.length > 0 ? [
        {
          id: 'addon-group-1',
          name: 'Tambahan & Pilihan',
          maxSelect: matchingAddOns.length,
          options: matchingAddOns.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: Number(addon.price || 0),
          } as AddOnOption)),
        },
      ] : [];

      return {
        id: item.id,
        posSku: item.id ? item.id.slice(-6).toUpperCase() : 'SKU-001',
        name: item.name,
        description: item.description || `Menu pilihan khas Kedai Nyamleng - ${item.name}.`,
        price: Number(item.price),
        categoryId: categorySlug,
        // Use actual image from Kasir App, or a smart fallback per category
        image: item.imageUrl || getFallbackImage(categorySlug),
        tags: ['Terlaris'],
        isAvailable: item.isActive,
        preparationTimeMinutes: 7,
        variantGroups: [],
        addOnGroups,
        // Store raw category for filtering
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

// Fetch all active add-ons for standalone usage (e.g. real-time reload)
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
