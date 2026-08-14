'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, MessageSquare, Clock } from 'lucide-react';
import { MenuItem, SelectedAddOn, SelectedVariant } from '@/types/pos';
import { useCartStore } from '@/store/useCartStore';

interface ItemCustomizeModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ItemCustomizeModal: React.FC<ItemCustomizeModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const { addToCart } = useCartStore();

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>([]);
  const [itemNotes, setItemNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Initialize defaults whenever item changes
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setItemNotes('');
      setSelectedAddOns([]);

      // Auto-select first variant in required groups
      const defaultVariants: SelectedVariant[] = [];
      item.variantGroups?.forEach((group) => {
        if (group.options.length > 0) {
          defaultVariants.push({
            groupId: group.id,
            groupName: group.name,
            optionId: group.options[0].id,
            optionName: group.options[0].name,
            priceModifier: group.options[0].priceModifier,
          });
        }
      });
      setSelectedVariants(defaultVariants);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleVariantSelect = (groupId: string, groupName: string, optionId: string, optionName: string, priceModifier: number) => {
    setSelectedVariants((prev) => {
      const filtered = prev.filter((v) => v.groupId !== groupId);
      return [
        ...filtered,
        { groupId, groupName, optionId, optionName, priceModifier },
      ];
    });
  };

  const handleAddOnToggle = (optionId: string, optionName: string, price: number) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.optionId === optionId);
      if (exists) {
        return prev.filter((a) => a.optionId !== optionId);
      } else {
        return [...prev, { optionId, optionName, price }];
      }
    });
  };

  const variantExtra = selectedVariants.reduce((acc, v) => acc + v.priceModifier, 0);
  const addOnExtra = selectedAddOns.reduce((acc, a) => acc + a.price, 0);
  const unitPrice = item.price + variantExtra + addOnExtra;
  const totalPrice = unitPrice * quantity;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleConfirmAddToCart = () => {
    addToCart(item, selectedVariants, selectedAddOns, itemNotes, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative w-full h-48 sm:h-56 bg-parchment-soft">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
              SKU: {item.posSku}
            </span>
            <h2 className="text-xl font-extrabold">{item.name}</h2>
            {item.preparationTimeMinutes && (
              <p className="text-xs text-gray-200 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Estimasi waktu saji: ~{item.preparationTimeMinutes} menit
              </p>
            )}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-charcoal">
          {/* Description */}
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-parchment-soft p-3 rounded-xl border border-parchment-border">
            {item.description}
          </p>

          {/* Variant Groups (Radio style) */}
          {item.variantGroups?.map((group) => (
            <div key={group.id} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-charcoal">{group.name}</h4>
                {group.required && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-nyamleng-500 bg-nyamleng-50 px-2 py-0.5 rounded-md">
                    Wajib Pilihh
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedVariants.some(
                    (v) => v.groupId === group.id && v.optionId === option.id
                  );

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleVariantSelect(
                          group.id,
                          group.name,
                          option.id,
                          option.name,
                          option.priceModifier
                        )
                      }
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-nyamleng-500 bg-nyamleng-50 text-nyamleng-600 shadow-xs'
                          : 'border-parchment-border hover:bg-parchment-soft text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-nyamleng-500 bg-nyamleng-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span>{option.name}</span>
                      </div>
                      {option.priceModifier > 0 && (
                        <span className="text-[11px] font-bold text-nyamleng-600">
                          +{formatRupiah(option.priceModifier)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Add-On Groups (Checkbox style) */}
          {item.addOnGroups?.map((group) => (
            <div key={group.id} className="space-y-2.5 pt-2 border-t border-parchment-border">
              <h4 className="font-bold text-sm text-charcoal">{group.name}</h4>
              <div className="space-y-2">
                {group.options.map((option) => {
                  const isSelected = selectedAddOns.some(
                    (a) => a.optionId === option.id
                  );

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleAddOnToggle(option.id, option.name, option.price)
                      }
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-nyamleng-500 bg-nyamleng-50 text-nyamleng-600 shadow-xs'
                          : 'border-parchment-border hover:bg-parchment-soft text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'border-nyamleng-500 bg-nyamleng-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span>{option.name}</span>
                      </div>
                      <span className="text-[11px] font-bold text-nyamleng-600">
                        +{formatRupiah(option.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Kitchen Notes */}
          <div className="space-y-2 pt-2 border-t border-parchment-border">
            <label className="flex items-center gap-1.5 font-bold text-sm text-charcoal">
              <MessageSquare className="w-4 h-4 text-nyamleng-500" />
              Catatan Khusus untuk Dapur
            </label>
            <input
              type="text"
              placeholder="Contoh: Sambal dipisah, tidak pakai daun bawang..."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-parchment-soft rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-parchment-border flex items-center gap-4">
          {/* Quantity Controls */}
          <div className="flex items-center border border-parchment-border rounded-xl p-1 bg-parchment-soft">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-charcoal transition-colors disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-extrabold text-sm text-charcoal">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-charcoal transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleConfirmAddToCart}
            className="flex-1 py-3 px-4 bg-nyamleng-500 hover:bg-nyamleng-600 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-between transition-all"
          >
            <span>Tambah ke Keranjang</span>
            <span>{formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
