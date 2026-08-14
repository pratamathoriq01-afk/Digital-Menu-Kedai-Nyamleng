'use client';

import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Utensils } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export const CartDrawer: React.FC = () => {
  const {
    cartItems,
    isCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    orderType,
    getSubtotal,
    getTaxAmount,
    getTotalAmount,
    toggleCheckout,
  } = useCartStore();

  if (!isCartOpen) return null;

  const subtotal = getSubtotal();
  const tax = getTaxAmount();
  const total = getTotalAmount();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleProceedToCheckout = () => {
    toggleCart(false);
    toggleCheckout(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-white flex flex-col shadow-2xl animate-slide-up">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-charcoal text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-nyamleng-400" />
              <div>
                <h2 className="font-extrabold text-base">Keranjang Pesanan</h2>
                <p className="text-[11px] text-gray-300">
                  {orderType === 'TAKEAWAY' ? 'Takeaway (Ambil Sendiri)' : 'Delivery (Antar Pesanan)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Kosongkan
                </button>
              )}
              <button
                onClick={() => toggleCart(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Tutup Keranjang"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-parchment">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-gray-400">
                <div className="w-16 h-16 rounded-full bg-parchment-soft flex items-center justify-center">
                  <Utensils className="w-8 h-8 text-gray-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal">Keranjang Masih Kosong</h3>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Pilih menu makanan atau minuman kesukaanmu dan tambahkan ke keranjang.
                  </p>
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white p-3.5 rounded-2xl border border-parchment-border shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <img
                      src={item.menuItem.image}
                      alt={item.menuItem.name}
                      className="w-14 h-14 object-cover rounded-xl bg-parchment-soft flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-charcoal truncate">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-xs font-extrabold text-nyamleng-600">
                        {formatRupiah(item.unitPrice)}
                      </p>

                      {item.selectedVariants.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedVariants.map((v) => (
                            <span
                              key={v.optionId}
                              className="text-[10px] bg-parchment-soft text-gray-600 px-1.5 py-0.5 rounded font-medium"
                            >
                              {v.optionName}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.selectedAddOns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.selectedAddOns.map((a) => (
                            <span
                              key={a.optionId}
                              className="text-[10px] bg-nyamleng-50 text-nyamleng-600 px-1.5 py-0.5 rounded font-medium"
                            >
                              +{a.optionName}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.itemNotes && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 italic">
                          <span>Note:</span> {item.itemNotes}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      aria-label="Hapus Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-parchment-border flex items-center justify-between">
                    <div className="flex items-center border border-parchment-border rounded-lg bg-parchment-soft p-0.5">
                      <button
                        onClick={() => updateQuantity(item.cartItemId, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-charcoal transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-charcoal transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-extrabold text-xs text-charcoal">
                      Subtotal: {formatRupiah(item.itemSubtotal)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Summary & Checkout Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 bg-white border-t border-parchment-border space-y-3 shadow-lg">
              <div className="space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Pesanan</span>
                  <span className="font-semibold text-charcoal">{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak Resto (PB1 10%)</span>
                  <span className="font-semibold text-charcoal">{formatRupiah(tax)}</span>
                </div>
                <div className="pt-2 border-t border-parchment-border flex justify-between items-center text-sm font-extrabold text-charcoal">
                  <span>Total Pembayaran</span>
                  <span className="text-base text-nyamleng-600">{formatRupiah(total)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 bg-nyamleng-500 hover:bg-nyamleng-600 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
