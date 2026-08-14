'use client';

import React from 'react';
import { Plus, Minus, Flame, Star, Tag, Clock } from 'lucide-react';
import { MenuItem } from '@/types/pos';
import { useCartStore } from '@/store/useCartStore';

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
    // Find the cart item for this simple item and decrease count
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
    <div
      onClick={() => onOpenCustomize(item)}
      className="group relative bg-white rounded-2xl border border-parchment-border overflow-hidden shadow-soft-card hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-parchment-soft">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Tags Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          {item.tags?.map((tag) => {
            let badgeStyle = 'bg-charcoal/80 text-white';
            let icon = null;

            if (tag === 'Terlaris') {
              badgeStyle = 'bg-amber-500 text-white font-bold';
              icon = <Star className="w-3 h-3 fill-white" />;
            } else if (tag === 'Pedas') {
              badgeStyle = 'bg-red-600 text-white font-bold';
              icon = <Flame className="w-3 h-3 fill-white" />;
            } else if (tag === 'Rekomendasi') {
              badgeStyle = 'bg-nyamleng-500 text-white font-bold';
              icon = <Star className="w-3 h-3 fill-white" />;
            } else if (tag === 'Hemat') {
              badgeStyle = 'bg-emerald-600 text-white font-bold';
              icon = <Tag className="w-3 h-3 fill-white" />;
            }

            return (
              <span
                key={tag}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider backdrop-blur-md shadow-sm ${badgeStyle}`}
              >
                {icon}
                {tag}
              </span>
            );
          })}
        </div>

        {/* Prep Time Badge */}
        {item.preparationTimeMinutes && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>~{item.preparationTimeMinutes} mnt</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-bold text-sm md:text-base text-charcoal group-hover:text-nyamleng-500 transition-colors line-clamp-1">
              {item.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-parchment-border flex items-center justify-between mt-auto">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 block tracking-tight">
              SKU: {item.posSku}
            </span>
            <span className="font-extrabold text-sm md:text-base text-nyamleng-600">
              {formatRupiah(item.price)}
            </span>
          </div>

          {/* Add / Quantity Button */}
          <div>
            {itemInCartCount > 0 && !hasOptions ? (
              <div className="flex items-center gap-2 bg-nyamleng-500 text-white p-1 rounded-xl shadow-sm">
                <button
                  onClick={handleMinusClick}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nyamleng-600 transition-colors"
                  aria-label="Kurangi Jumlah"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs px-1">{itemInCartCount}</span>
                <button
                  onClick={handleAddClick}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-nyamleng-600 transition-colors"
                  aria-label="Tambah Jumlah"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddClick}
                className="flex items-center gap-1.5 px-3 py-2 bg-nyamleng-500 hover:bg-nyamleng-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{hasOptions ? 'Kustom' : 'Tambah'}</span>
                {itemInCartCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white text-nyamleng-600 rounded-full text-[10px] font-extrabold">
                    {itemInCartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
