'use client';

import React, { useState, useEffect } from 'react';
import { ChefHat, CheckCircle2, Clock, Flame, Bell, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { OrderStatus } from '@/types/pos';
import { playSuccessChime, showSystemNotification } from '@/lib/notificationHelper';

export const FloatingNotificationBanner: React.FC = () => {
  const { activeOrder, toggleOrderStatus } = useCartStore();
  const [lastStatus, setLastStatus] = useState<OrderStatus | null>(null);
  const [notification, setNotification] = useState<{
    title: string;
    message: string;
    icon: React.ReactNode;
    status: OrderStatus;
  } | null>(null);

  useEffect(() => {
    if (!activeOrder || !activeOrder.orderStatus) return;

    const current = activeOrder.orderStatus;

    // Detect status change
    if (lastStatus && lastStatus !== current) {
      let title = 'Kedai Nyamleng';
      let message = '';
      let icon = <Bell className="w-5 h-5 text-amber-500" />;

      if (current === 'CONFIRMED') {
        title = 'Kedai Nyamleng • Pesanan Diterima';
        message = `✅ Pesanan #${activeOrder.orderId} telah diterima Kasir & diteruskan ke dapur!`;
        icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      } else if (current === 'KITCHEN_PROCESSING') {
        title = 'Kedai Nyamleng • Sedang Dimasak';
        message = `🍳 Dapur sedang menyiapkan pesanan #${activeOrder.orderId} (Estimasi ±5-7 mnt).`;
        icon = <Flame className="w-5 h-5 text-orange-500" />;
      } else if (current === 'READY') {
        title = 'Kedai Nyamleng • Pesanan Siap!';
        message = `🎉 Pesanan #${activeOrder.orderId} selesai dimasak! Silakan ambil di kasir / menunggu kurir.`;
        icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      }

      if (message) {
        setNotification({ title, message, icon, status: current });
        playSuccessChime();
        showSystemNotification(title, message);

        // Auto dismiss after 6 seconds
        const timer = setTimeout(() => {
          setNotification(null);
        }, 6000);

        return () => clearTimeout(timer);
      }
    }

    setLastStatus(current);
  }, [activeOrder?.orderStatus, activeOrder?.orderId, lastStatus]);

  if (!notification) return null;

  return (
    <div 
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-down cursor-pointer"
      onClick={() => {
        toggleOrderStatus(true);
        setNotification(null);
      }}
    >
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20 flex items-start gap-3.5 transition-all hover:scale-102">
        {/* App Icon with Online Pulse */}
        <div className="relative p-2.5 rounded-xl bg-nyamleng-500 text-white shrink-0 shadow-md">
          {notification.icon}
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-slate-900" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              {notification.title}
            </span>
            <span className="text-[10px] text-gray-400">Baru saja</span>
          </div>
          <p className="text-xs font-semibold text-slate-100 mt-0.5 leading-snug">
            {notification.message}
          </p>
          <span className="text-[10px] text-nyamleng-300 font-bold block mt-1.5 underline">
            Ketuk untuk lihat live tracking dapur →
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setNotification(null);
          }}
          className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
