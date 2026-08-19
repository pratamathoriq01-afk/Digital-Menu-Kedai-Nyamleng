'use client';

import React, { useMemo } from 'react';
import { 
  Grid,
  Drumstick,
  Fish,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Package,
  IceCream,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

// Icon mapping for each known category slug from Kasir App
const SLUG_ICON_MAP: Record<string, React.ReactNode> = {
  'ayam-nyamleng': <Drumstick className="w-4 h-4" />,
  'ikan-nyamleng': <Fish className="w-4 h-4" />,
  'minuman': <Coffee className="w-4 h-4" />,
  'alacarte': <UtensilsCrossed className="w-4 h-4" />,
  'snack': <Cookie className="w-4 h-4" />,
  'paket-hemat': <Package className="w-4 h-4" />,
  'dessert': <IceCream className="w-4 h-4" />,
  'makanan': <UtensilsCrossed className="w-4 h-4" />,
  'promo': <Sparkles className="w-4 h-4" />,
};

// Display name overrides per slug (matches Kasir App category names)
const SLUG_LABEL_MAP: Record<string, string> = {
  'ayam-nyamleng': '🍗 Ayam Nyamleng',
  'ikan-nyamleng': '🐟 Ikan Nyamleng',
  'minuman': '🥤 Minuman',
  'alacarte': '🍱 Ala Carte',
  'snack': '🍟 Cemilan & Snack',
  'paket-hemat': '📦 Paket Hemat',
  'dessert': '🍰 Dessert',
  'makanan': '🍽️ Makanan',
  'promo': '✨ Promo',
};

export const CategoryNav: React.FC = () => {
  const { menuItems, selectedCategory, setSelectedCategory } = useCartStore();

  // Derive categories dynamically from actual menu items fetched from Supabase
  const dynamicCategories = useMemo(() => {
    const seen = new Set<string>();
    const cats: { id: string; label: string; icon: React.ReactNode }[] = [];

    for (const item of menuItems) {
      const slug = item.categoryId;
      if (!seen.has(slug)) {
        seen.add(slug);
        cats.push({
          id: slug,
          label: SLUG_LABEL_MAP[slug] || slug,
          icon: SLUG_ICON_MAP[slug] || <UtensilsCrossed className="w-4 h-4" />,
        });
      }
    }

    return cats;
  }, [menuItems]);

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return menuItems.length;
    return menuItems.filter((item) => item.categoryId === catId).length;
  };

  return (
    <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-parchment-border py-2.5 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {/* Semua Menu chip */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-nyamleng-500 text-white shadow-md shadow-nyamleng-500/20 scale-105'
                : 'bg-parchment-soft text-charcoal-light hover:bg-parchment-border hover:text-charcoal'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Semua Menu</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedCategory === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {getCategoryCount('all')}
            </span>
          </button>

          {/* Dynamic category chips from Supabase data */}
          {dynamicCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);
            if (count === 0) return null; // Don't show empty categories

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-nyamleng-500 text-white shadow-md shadow-nyamleng-500/20 scale-105'
                    : 'bg-parchment-soft text-charcoal-light hover:bg-parchment-border hover:text-charcoal'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
