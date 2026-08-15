'use client';

import React from 'react';
import { 
  Sparkles, 
  UtensilsCrossed, 
  Coffee, 
  Cookie, 
  IceCream, 
  Grid 
} from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_MENU_ITEMS } from '@/data/mockMenu';
import { useCartStore } from '@/store/useCartStore';

const ICON_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="w-4 h-4" />,
  UtensilsCrossed: <UtensilsCrossed className="w-4 h-4" />,
  Coffee: <Coffee className="w-4 h-4" />,
  Cookie: <Cookie className="w-4 h-4" />,
  IceCream: <IceCream className="w-4 h-4" />,
};

export const CategoryNav: React.FC = () => {
  const { menuItems, selectedCategory, setSelectedCategory } = useCartStore();

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return menuItems.length;
    return menuItems.filter((item) => item.categoryId === catId).length;
  };

  return (
    <nav className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-parchment-border py-2.5 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {/* All Category Chip */}
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

          {/* Dynamic Categories */}
          {MOCK_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const count = getCategoryCount(cat.id);

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
                {ICON_MAP[cat.iconName] || <UtensilsCrossed className="w-4 h-4" />}
                <span>{cat.name}</span>
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
