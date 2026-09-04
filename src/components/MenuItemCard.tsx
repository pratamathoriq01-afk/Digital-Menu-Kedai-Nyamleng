'use client';

import React, { memo } from 'react';
import { Plus, Minus, Flame, Star, Tag, Clock } from 'lucide-react';
import { MenuItem } from '@/types/pos';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MenuItemCardProps {
  item: MenuItem;
  onOpenCustomize: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = memo(({ item, onOpenCustomize }) => {
  const { cartItems, addToCart, updateQuantity } = useCartStore();

  // Find total quantity of this menu item in cart
  const itemInCartCount = cartItems
    .filter((ci) => ci.menuItem.id === item.id)
    .reduce((acc, ci) => acc + ci.quantity, 0);

  const hasOptions = (item.variantGroups && item.variantGroups.length > 0) || 
                     (item.addOnGroups && item.addOnGroups.length > 0);

  const isAvailable = item.isAvailable !== false;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    if (hasOptions) {
      onOpenCustomize(item);
    } else {
      addToCart(item);
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable) return;
    const cartItem = cartItems.find((ci) => ci.menuItem.id === item.id);
    if (cartItem) {
      updateQuantity(cartItem.cartItemId, -1);
    }
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card
      onClick={() => {
        if (!isAvailable) return;
        onOpenCustomize(item);
      }}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs transition-all duration-200 flex flex-col justify-between p-0 h-full ${
        isAvailable 
          ? 'hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' 
          : 'opacity-75 cursor-not-allowed bg-slate-50/70 dark:bg-slate-900/70'
      }`}
    >
      {/* Image Container with compact aspect ratio */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] max-h-36 sm:max-h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={item.image}
          alt={item.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isAvailable ? 'group-hover:scale-105' : 'grayscale contrast-75'
          }`}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Sold Out Watermark Badge */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="px-3 py-1 bg-red-600/95 text-white font-black text-xs sm:text-sm tracking-wider uppercase rounded-xl shadow-lg border border-red-400/30 rotate-[-6deg]">
              Habis / Sold Out
            </span>
          </div>
        )}

        {/* Tags Overlay */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
          {item.tags?.slice(0, 1).map((tag) => {
            let customBg = 'bg-slate-900/80 text-white';
            let icon = null;

            if (tag === 'Terlaris') {
              customBg = 'bg-amber-500 text-white font-black';
              icon = <Star className="w-2.5 h-2.5 fill-white" />;
            } else if (tag === 'Pedas') {
              customBg = 'bg-red-600 text-white font-black';
              icon = <Flame className="w-2.5 h-2.5 fill-white" />;
            } else if (tag === 'Rekomendasi') {
              customBg = 'bg-orange-600 text-white font-black';
              icon = <Star className="w-2.5 h-2.5 fill-white" />;
            } else if (tag === 'Hemat') {
              customBg = 'bg-emerald-600 text-white font-black';
              icon = <Tag className="w-2.5 h-2.5 fill-white" />;
            }

            return (
              <Badge
                key={tag}
                className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider shadow-xs border-none ${customBg}`}
              >
                {icon}
                <span>{tag}</span>
              </Badge>
            );
          })}
        </div>

        {/* Prep Time Badge */}
        {item.preparationTimeMinutes && (
          <Badge className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white border-none px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 font-semibold">
            <Clock className="w-2.5 h-2.5 text-amber-400" />
            <span>~{item.preparationTimeMinutes} m</span>
          </Badge>
        )}
      </div>

      {/* Content Section */}
      <CardContent className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-1.5">
        <div>
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-1 sm:line-clamp-2 leading-tight">
            {item.name}
          </h3>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5 leading-snug">
            {item.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 mt-auto">
          <div className="min-w-0">
            <span className="font-black text-xs sm:text-sm text-orange-600 dark:text-orange-400 truncate block">
              {formatRupiah(item.price)}
            </span>
          </div>

          {/* Add / Quantity Button */}
          <div className="shrink-0">
            {!isAvailable ? (
              <span className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-[10px] sm:text-xs rounded-lg border border-slate-200 dark:border-slate-700">
                Habis
              </span>
            ) : itemInCartCount > 0 && !hasOptions ? (
              <div className="flex items-center gap-1 bg-orange-600 text-white p-0.5 rounded-lg shadow-sm">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMinusClick}
                  className="w-5 h-5 sm:w-6 sm:h-6 hover:bg-orange-700 text-white rounded p-0"
                  aria-label="Kurangi Jumlah"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="font-black text-[11px] sm:text-xs px-1">{itemInCartCount}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddClick}
                  className="w-5 h-5 sm:w-6 sm:h-6 hover:bg-orange-700 text-white rounded p-0"
                  aria-label="Tambah Jumlah"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAddClick}
                className="flex items-center gap-1 px-2 sm:px-2.5 h-6 sm:h-7 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-[10px] sm:text-xs rounded-lg shadow-xs transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>{hasOptions ? 'Pilih' : 'Tambah'}</span>
                {itemInCartCount > 0 && (
                  <Badge className="ml-0.5 px-1 py-0 bg-white text-orange-600 rounded-full text-[9px] font-black border-none">
                    {itemInCartCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MenuItemCard.displayName = 'MenuItemCard';
