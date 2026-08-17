import { supabase } from '@/lib/supabaseClient';
import { MenuItem } from '@/types/pos';
import { MOCK_MENU_ITEMS } from '@/data/mockMenu';

export const fetchSupabaseMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const { data, error } = await supabase
      .from('MenuItem')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });

    if (error || !data || data.length === 0) {
      console.log('[Supabase Menu] Falling back to mock menu items (Error or Empty):', error?.message);
      return MOCK_MENU_ITEMS;
    }

    const mappedItems: MenuItem[] = data.map((item: any) => {
      let catId = 'makanan';
      const rawCat = (item.category || '').toLowerCase();
      if (rawCat.includes('minum')) catId = 'minuman';
      else if (rawCat.includes('cemil') || rawCat.includes('snack')) catId = 'snack';
      else if (rawCat.includes('makan')) catId = 'makanan';
      else catId = 'makanan';

      return {
        id: item.id,
        posSku: item.id ? item.id.slice(-6).toUpperCase() : 'SKU-001',
        name: item.name,
        description: item.description || `Menu pilihan khas Kedai Nyamleng cita rasa Malang (${item.name}).`,
        price: Number(item.price),
        categoryId: catId,
        image: item.imageUrl || (catId === 'minuman' 
          ? 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800'
          : 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800'),
        tags: ['Terlaris'],
        isAvailable: item.isActive,
        preparationTimeMinutes: 7,
        variantGroups: [],
        addOnGroups: [],
      };
    });

    return mappedItems;
  } catch (err) {
    console.error('[Supabase Menu Exception]:', err);
    return MOCK_MENU_ITEMS;
  }
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
