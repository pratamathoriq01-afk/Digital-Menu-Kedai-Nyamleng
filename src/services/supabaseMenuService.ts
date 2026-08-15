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

    const mappedItems: MenuItem[] = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category ? item.category.toLowerCase() : 'makanan',
      price: Number(item.price),
      description: item.description || `Menu spesial khas Kedai Nyamleng cita rasa Malang (${item.name}).`,
      imageUrl: item.imageUrl || (item.category?.toLowerCase() === 'minuman' 
        ? 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=800'
        : 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800'),
      isBestSeller: true,
      isAvailable: item.isActive,
      preparationTimeMinutes: 7,
      variants: [],
      addOns: [],
    }));

    return mappedItems;
  } catch (err) {
    console.error('[Supabase Menu Exception]:', err);
    return MOCK_MENU_ITEMS;
  }
};
