'use client';

import React from 'react';
import { ChefHat, Flame, CheckCircle2, Clock, ChevronRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export const FloatingOrderStatus: React.FC = () => {
  const { activeOrder, toggleOrderStatus, isOrderStatusOpen, isCheckoutOpen, isCartOpen } = useCartStore();

  // Only show if there is an active order and tracking modals aren't currently open
  if (!activeOrder || isOrderStatusOpen || isCheckoutOpen || isCartOpen) {
    return null;
  }

  const status = activeOrder.orderStatus || 'PENDING';
  if (status === 'COMPLETED') return null;

  let statusText = 'Pesanan Terkirim';
  let badgeColor = 'bg-amber-500';
  let Icon = Clock;
  let pulse = true;

  if (status === 'PENDING') {
    statusText = 'Menunggu Kasir Menerima...';
    badgeColor = 'bg-amber-500 text-white';
    Icon = Clock;
  } else if (status === 'CONFIRMED') {
    statusText = 'Pesanan Diterima Kasir';
    badgeColor = 'bg-blue-600 text-white';
    Icon = CheckCircle2;
  } else if (status === 'KITCHEN_PROCESSING') {
    statusText = 'Dapur Sedang Memasak 🍳';
    badgeColor = 'bg-orange-500 text-white';
    Icon = Flame;
  } else if (status === 'READY') {
    statusText = 'Pesanan Siap Disajikan! 🎉';
    badgeColor = 'bg-emerald-600 text-white';
    Icon = CheckCircle2;
    pulse = false;
  }

  return (
    <aside 
      aria-label="Floating Live Order Status"
      className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-slide-up"
    >
      <button
        type="button"
        onClick={() => toggleOrderStatus(true)}
        className="w-full bg-slate-950/90 hover:bg-slate-900 text-white backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-2xl border border-white/15 flex items-center justify-between gap-3 transition-all hover:scale-102 active:scale-98 cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Animated Icon Pill */}
          <div className={`p-2 rounded-xl ${badgeColor} shrink-0 shadow-md ${pulse ? 'animate-pulse' : ''}`}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs text-white truncate">
                Pesanan #{activeOrder.orderId}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-amber-300">
                Live
              </span>
            </div>
            <p className="text-[11px] text-gray-300 font-semibold truncate mt-0.5">
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-nyamleng-300 font-bold text-xs shrink-0">
          <span>Pantau</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </aside>
  );
};
