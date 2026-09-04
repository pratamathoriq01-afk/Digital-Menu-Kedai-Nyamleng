import { supabase } from '@/lib/supabaseClient';
import { MenuItem, AddOnOption, AddOnGroup, StoreSettings, VariantGroup } from '@/types/pos';

// Mapping kategori Kasir App → slug yang digunakan di Menu Digital
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'menu ayam nyamleng': 'ayam-nyamleng',
  'menu ikan nyamleng': 'ikan-nyamleng',
  'menu minuman': 'minuman',
  'menu alacarte': 'alacarte',
  'menu tahu tempe': 'menu-tahu-tempe',
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
  if (lower.includes('paket') || lower.includes('bundling') || lower.includes('komplit') || lower.includes('promo')) return 'paket-hemat';
  if (lower.includes('ayam')) return 'ayam-nyamleng';
  if (lower.includes('ikan') || lower.includes('seafood') || lower.includes('tongkol') || lower.includes('lele') || lower.includes('bebek')) return 'ikan-nyamleng';
  if (lower.includes('tahu') || lower.includes('tempe')) return 'menu-tahu-tempe';
  if (lower.includes('alacarte') || lower.includes('ala carte')) return 'alacarte';
  if (lower.includes('cemil') || lower.includes('snack') || lower.includes('gorengan')) return 'snack';
  if (lower.includes('minum') || lower.includes('drink') || lower.includes('beverage') || lower.includes('es ') || lower.includes('kopi')) return 'minuman';
  if (lower.includes('dessert')) return 'dessert';
  return 'makanan';
};

/**
 * Dynamic Category Sorting Rank matching Kasir App (data-service.ts)
 */
export function getCategorySortRank(categoryName: string): number {
  const cat = (categoryName || '').toLowerCase().trim();
  if (cat.includes('paket') || cat.includes('bundling') || cat.includes('komplit') || cat.includes('promo')) return 1;
  if (cat.includes('ayam')) return 2;
  if (cat.includes('ikan') || cat.includes('seafood') || cat.includes('tongkol') || cat.includes('lele') || cat.includes('bebek')) return 3;
  if (cat.includes('alacarte') || cat.includes('ala carte') || cat.includes('tahu') || cat.includes('tempe') || cat.includes('makanan')) return 4;
  if (cat.includes('snack') || cat.includes('cemilan') || cat.includes('gorengan') || cat.includes('dessert') || cat.includes('sambal')) return 5;
  if (cat.includes('minuman') || cat.includes('drink') || cat.includes('beverage') || cat.includes('es ') || cat.includes('kopi')) return 99;
  return 10;
}

/**
 * Dynamic Category Icon assignment
 */
export function getCategoryIcon(categoryName: string): string {
  const cat = (categoryName || '').toLowerCase().trim();
  if (cat.includes('paket') || cat.includes('promo') || cat.includes('hemat')) return '📦';
  if (cat.includes('ayam')) return '🍗';
  if (cat.includes('ikan') || cat.includes('seafood') || cat.includes('tongkol') || cat.includes('lele') || cat.includes('bebek')) return '🐟';
  if (cat.includes('tahu') || cat.includes('tempe')) return '🍽️';
  if (cat.includes('alacarte') || cat.includes('ala carte')) return '🍱';
  if (cat.includes('snack') || cat.includes('cemilan') || cat.includes('gorengan')) return '🍟';
  if (cat.includes('dessert')) return '🍰';
  if (cat.includes('minuman') || cat.includes('drink') || cat.includes('beverage') || cat.includes('es') || cat.includes('kopi')) return '🥤';
  return '🍽️';
}

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
      weeklySchedule: data.weeklySchedule || null,
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
    const activeAddOns = allAddOns.filter((a) => a.isActive);

    // Active drinks from etalase menu items (for Paket Hemat inclusion)
    const etalaseDrinks = (data || [])
      .filter((m: any) => {
        const cat = (m.category || '').toLowerCase();
        const active = m.isActive !== undefined ? Boolean(m.isActive) : true;
        return active && (cat.includes('minum') || cat.includes('drink'));
      })
      .map((m: any) => ({
        id: `etalase-drink-${m.id}`,
        name: `${m.name} (Paket)`,
        price: 0,
        category: '🍹 Pilihan Minuman Paket',
        isActive: true,
      }));

    // 1. Nasi / Karbo Add-Ons
    const rawNasiAddOns = activeAddOns.filter((a) => {
      const cat = (a.category || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      return (
        cat === '🍚 pilihan nasi' ||
        cat.includes('nasi') ||
        cat.includes('karbo') ||
        name.includes('nasi putih') ||
        name.includes('nasi daun jeruk') ||
        name.includes('tanpa nasi') ||
        (name.includes('nasi') && !name.includes('tahu'))
      );
    });

    // 2. Sambal Add-Ons
    const rawSambalAddOns = activeAddOns.filter((a) => {
      if (rawNasiAddOns.includes(a)) return false;
      const cat = (a.category || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      return (
        cat === '🌶️ pilihan sambal' ||
        cat.includes('sambal') ||
        name.includes('sambal') ||
        name.includes('bawang') ||
        name.includes('hijau') ||
        name.includes('matah') ||
        name.includes('terasi')
      );
    });

    // 3. Pedas Add-Ons
    const rawPedasAddOns = activeAddOns.filter((a) => {
      if (rawNasiAddOns.includes(a) || rawSambalAddOns.includes(a)) return false;
      const cat = (a.category || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      return (
        cat === '🔥 level pedas' ||
        cat.includes('pedas') ||
        name.includes('pedas') ||
        name.includes('level') ||
        name.includes('sedang') ||
        name.includes('super')
      );
    });

    // 4. Paket Drink Add-Ons (Custom + Etalase Drinks)
    const rawPaketDrinkAddOns = activeAddOns.filter((a) => {
      if (rawNasiAddOns.includes(a) || rawSambalAddOns.includes(a) || rawPedasAddOns.includes(a)) return false;
      const cat = (a.category || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      return (
        cat === '🍹 pilihan minuman paket' ||
        cat.includes('minuman paket') ||
        cat.includes('minum') ||
        name.includes('(paket)') ||
        (name.includes('es') && name.includes('teh')) ||
        (name.includes('es') && name.includes('jeruk')) ||
        name.includes('mineral') ||
        name.includes('teh manis')
      );
    });

    const combinedPaketDrinkAddOns = [...rawPaketDrinkAddOns];
    for (const ed of etalaseDrinks) {
      const cleanEdName = ed.name.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
      const exists = combinedPaketDrinkAddOns.some((a) => {
        const cleanAName = (a.name || '').toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
        return cleanAName === cleanEdName;
      });
      if (!exists) {
        combinedPaketDrinkAddOns.push(ed);
      }
    }

    // 5. Ice / Suhu Add-Ons
    const rawIceAddOns = activeAddOns.filter((a) => {
      if (rawNasiAddOns.includes(a) || rawPaketDrinkAddOns.includes(a)) return false;
      const cat = (a.category || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      return (
        cat === '🥤 pilihan es & gula' ||
        cat === 'semua minuman' ||
        cat.includes('es') ||
        cat.includes('suhu') ||
        name.includes('es normal') ||
        name.includes('es sedikit') ||
        name.includes('tanpa es') ||
        name.includes('less ice') ||
        name.includes('hangat')
      );
    });

    // 6. Sugar / Manis Add-Ons
    const rawSugarAddOns = activeAddOns.filter((a) => {
      if (rawNasiAddOns.includes(a) || rawPaketDrinkAddOns.includes(a) || rawIceAddOns.includes(a)) return false;
      const cat = (a.category || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      return (
        cat === '🍬 level manis' ||
        cat.includes('gula') ||
        cat.includes('manis') ||
        name.includes('gula normal') ||
        name.includes('gula sedikit') ||
        name.includes('tanpa gula') ||
        name.includes('less sugar')
      );
    });

    // 7. Topping & General Add-Ons (Tahu, Tempe, Terong, Telur)
    const rawToppingAddOns = activeAddOns.filter(
      (a) =>
        !rawNasiAddOns.includes(a) &&
        !rawPaketDrinkAddOns.includes(a) &&
        !rawIceAddOns.includes(a) &&
        !rawSugarAddOns.includes(a) &&
        !rawSambalAddOns.includes(a) &&
        !rawPedasAddOns.includes(a)
    );

    const mappedItems: MenuItem[] = data.map((item: any) => {
      const categorySlug = mapCategoryToSlug(item.category || '');
      const isDrink = categorySlug === 'minuman' || (item.category || '').toLowerCase().includes('minuman');
      const isPaketItem =
        (item.category || '').toLowerCase().includes('paket') ||
        (item.category || '').toLowerCase().includes('bundling') ||
        item.name.toLowerCase().includes('paket') ||
        item.name.toLowerCase().includes('bundling');
      const isFoodItem = !isDrink;

      // Check allowed categories configured in Kasir App
      const allowedCats: string[] | null = Array.isArray(item.allowedAddOnCategories) && item.allowedAddOnCategories.length > 0
        ? item.allowedAddOnCategories
        : null;

      // Resilient category check matching clean string (identical to Kasir App AddOnPickerModal)
      const isGroupAllowed = (standardGroup: string, defaultCheck: boolean) => {
        if (allowedCats && allowedCats.length > 0) {
          const cleanStandard = standardGroup.toLowerCase().replace(/[^\w\s]/g, '').trim();
          return allowedCats.some((c) => {
            const cleanC = (c || '').toLowerCase().replace(/[^\w\s]/g, '').trim();
            return cleanC === cleanStandard || cleanC.includes(cleanStandard) || cleanStandard.includes(cleanC);
          });
        }
        return defaultCheck;
      };

      // Specific filtering per group
      const nasiAddOns = isGroupAllowed('Pilihan Nasi', isFoodItem && !item.name.toLowerCase().includes('sego')) ? rawNasiAddOns : [];
      const sambalAddOns = isGroupAllowed('Pilihan Sambal', isFoodItem) ? rawSambalAddOns : [];
      const pedasAddOns = isGroupAllowed('Level Pedas', isFoodItem) ? rawPedasAddOns : [];
      const paketDrinkAddOns = isGroupAllowed('Pilihan Minuman Paket', isPaketItem) ? combinedPaketDrinkAddOns : [];
      const iceAddOns = (isGroupAllowed('Level Es', !isFoodItem) || isGroupAllowed('Pilihan Es & Gula', !isFoodItem)) ? rawIceAddOns : [];
      const sugarAddOns = (isGroupAllowed('Level Manis', !isFoodItem) || isGroupAllowed('Pilihan Es & Gula', !isFoodItem)) ? rawSugarAddOns : [];
      const toppingAddOns = isGroupAllowed('Ekstra Topping', isFoodItem) ? rawToppingAddOns : [];

      const addOnGroups: AddOnGroup[] = [];

      // 1. Minuman Paket (Only for Paket Hemat)
      if (paketDrinkAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-paket-drink',
          name: '🍹 Pilihan Minuman Paket',
          isSingleSelect: true,
          options: paketDrinkAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      // 2. Nasi / Karbo
      if (nasiAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-nasi',
          name: '🍚 Pilihan Nasi / Karbo',
          isSingleSelect: true,
          options: nasiAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      // 3. Sambal
      if (sambalAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-sambal',
          name: '🌶️ Pilihan Jenis Sambal',
          isSingleSelect: true,
          options: sambalAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      // 4. Pedas
      if (pedasAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-pedas',
          name: '🔥 Level Kepedasan Sambal',
          isSingleSelect: true,
          options: pedasAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      // 5. Topping & Lauk Tambahan (Multi-Select)
      if (toppingAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-topping-food',
          name: '🍳 Ekstra Topping & Lauk Tambahan',
          isSingleSelect: false,
          options: toppingAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      // 6. Level Es / Suhu
      if (iceAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-ice',
          name: isDrink ? '🧊 Pilihan Level Es / Suhu' : '🧊 Level Es & Suhu Minuman',
          isSingleSelect: true,
          options: iceAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      // 7. Level Gula / Manis
      if (sugarAddOns.length > 0) {
        addOnGroups.push({
          id: 'group-sugar',
          name: isDrink ? '🍬 Pilihan Level Gula' : '🍬 Level Manis Minuman',
          isSingleSelect: true,
          options: sugarAddOns.map(a => ({ id: a.id, name: a.name, price: Number(a.price || 0) })),
        });
      }

      return {
        id: item.id,
        posSku: item.id ? item.id.slice(-6).toUpperCase() : 'SKU-001',
        name: item.name,
        description: item.description || `Menu pilihan khas Kedai Nyamleng - ${item.name}.`,
        price: Number(item.price),
        categoryId: categorySlug,
        categoryName: item.category || 'Menu Utama',
        image: item.imageUrl || getFallbackImage(categorySlug),
        tags: ['Terlaris'],
        isAvailable: item.isActive !== undefined ? Boolean(item.isActive) : true,
        preparationTimeMinutes: 7,
        variantGroups: [],
        addOnGroups,
        allowedAddOnCategories: item.allowedAddOnCategories || [],
        _rawCategory: item.category,
      } as MenuItem & { _rawCategory: string };
    });

    // Sort items hierarchically by category rank, then by price descending, then name ascending
    mappedItems.sort((a, b) => {
      const rankA = getCategorySortRank(a.categoryName || a.categoryId);
      const rankB = getCategorySortRank(b.categoryName || b.categoryId);
      if (rankA !== rankB) return rankA - rankB;
      return (b.price || 0) - (a.price || 0) || a.name.localeCompare(b.name);
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
