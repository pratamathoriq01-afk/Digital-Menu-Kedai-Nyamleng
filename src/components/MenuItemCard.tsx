'use client';

import React from 'react';
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

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onOpenCustomize }) => {
  const { cartItems, addToCart, updateQuantity } = useCartStore();

  // Find total quantity of this menu item in cart
  const itemInCartCount = cartItems
    .filter((ci) => ci.menuItem.id === item.id)
    .reduce((acc, ci) => acc + ci.quantity, 0);

  const hasOptions = (item.variantGroups && item.variantGroups.length > 0) || 
                     (item.addOnGroups && item.addOnGroups.length > 0);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasOptions) {
      onOpenCustomize(item);
    } else {
      addToCart(item);
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      onClick={() => onOpenCustomize(item)}
      className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer p-0"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Tags Overlay using shadcn Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {item.tags?.map((tag) => {
            let variant: "default" | "secondary" | "destructive" | "outline" = "default";
            let customBg = "bg-slate-900/80 text-white";
            let icon = null;

            if (tag === 'Terlaris') {
              customBg = 'bg-amber-500 hover:bg-amber-600 text-white font-bold border-none';
              icon = <Star className="w-3 h-3 fill-white" />;
            } else if (tag === 'Pedas') {
              customBg = 'bg-red-600 hover:bg-red-700 text-white font-bold border-none';
              icon = <Flame className="w-3 h-3 fill-white" />;
            } else if (tag === 'Rekomendasi') {
              customBg = 'bg-orange-600 hover:bg-orange-700 text-white font-bold border-none';
              icon = <Star className="w-3 h-3 fill-white" />;
            } else if (tag === 'Hemat') {
              customBg = 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-none';
              icon = <Tag className="w-3 h-3 fill-white" />;
            }

            return (
              <Badge
                key={tag}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-md shadow-sm ${customBg}`}
              >
                {icon}
                {tag}
              </Badge>
            );
          })}
        </div>

        {/* Prep Time Badge */}
        {item.preparationTimeMinutes && (
          <Badge className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md text-white border-none px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1 font-semibold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>~{item.preparationTimeMinutes} mnt</span>
          </Badge>
        )}
      </div>

      {/* Content Section with CardContent */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-extrabold text-sm md:text-base text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors line-clamp-1">
              {item.name}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 block tracking-tight">
              SKU: {item.posSku}
            </span>
            <span className="font-black text-sm md:text-base text-orange-600 dark:text-orange-400">
              {formatRupiah(item.price)}
            </span>
          </div>

          {/* Add / Quantity Button using shadcn Button UI */}
          <div>
            {itemInCartCount > 0 && !hasOptions ? (
              <div className="flex items-center gap-1.5 bg-orange-600 text-white p-1 rounded-xl shadow-md">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleMinusClick}
                  className="w-7 h-7 hover:bg-orange-700 text-white rounded-lg p-0 h-7"
                  aria-label="Kurangi Jumlah"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="font-extrabold text-xs px-1">{itemInCartCount}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleAddClick}
                  className="w-7 h-7 hover:bg-orange-700 text-white rounded-lg p-0 h-7"
                  aria-label="Tambah Jumlah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleAddClick}
                className="flex items-center gap-1.5 px-3 py-1.5 h-9 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{hasOptions ? 'Kustom' : 'Tambah'}</span>
                {itemInCartCount > 0 && (
                  <Badge className="ml-1 px-1.5 py-0.2 bg-white text-orange-600 rounded-full text-[10px] font-black border-none">
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
};
