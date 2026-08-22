'use client';

import React, { useEffect, useRef } from 'react';
import { ChefHat, Flame, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabaseClient';
import { OrderStatus } from '@/types/pos';

// Status values from Kasir App that mean the order is fully done
const COMPLETED_STATUSES = ['COMPLETED', 'ORDER_FINISH', 'FINISH', 'DONE', 'CANCELLED', 'REJECTED'];

// Maps raw Kasir App status strings to customer-facing OrderStatus
const mapKasirStatus = (raw: string): OrderStatus | 'COMPLETED' => {
  const r = raw.toUpperCase();
  if (COMPLETED_STATUSES.includes(r)) return 'COMPLETED';
  if (r === 'NEW_ORDER' || r === 'PENDING') return 'PENDING';
  if (r === 'ORDER_ACCEPTED' || r === 'CONFIRMED' || r === 'ACCEPTED') return 'CONFIRMED';
  if (r === 'IN_PROCESSED' || r === 'KITCHEN_PROCESSING' || r === 'PROCESSED' || r === 'PROCESSING') return 'KITCHEN_PROCESSING';
  if (r === 'ORDER_FINISH' || r === 'READY') return 'READY';
  return 'PENDING';
};

export const FloatingOrderStatus: React.FC = () => {
  const { activeOrder, toggleOrderStatus, isOrderStatusOpen, isCheckoutOpen, isCartOpen, setActiveOrder } = useCartStore();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Core status sync: runs whenever activeOrder changes (including on first mount from localStorage)
  useEffect(() => {
    if (!activeOrder?.orderId) {
      // Clear any lingering channels/intervals
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const currentOrderId = activeOrder.orderId;

    // Check if order is > 6 hours old (stale order guard)
    if (activeOrder.createdAt) {
      const createdTime = new Date(activeOrder.createdAt).getTime();
      const now = Date.now();
      if (now - createdTime > 6 * 60 * 60 * 1000) {
        console.log(`[FloatingOrderStatus] Order ${currentOrderId} is older than 6 hours. Auto-clearing activeOrder.`);
        setActiveOrder(null);
        return;
      }
    }

    const handleStatusUpdate = (rawStatus: string) => {
      const mappedStatus = mapKasirStatus(rawStatus);

      if (mappedStatus === 'COMPLETED') {
        // Order is done — clear from store so floating pill disappears
        console.log(`[FloatingOrderStatus] Order ${currentOrderId} is COMPLETED. Auto-clearing activeOrder.`);
        setActiveOrder(null);
        return;
      }

      // Update store with latest status if it changed
      useCartStore.setState((state) => {
        if (state.activeOrder && state.activeOrder.orderStatus !== mappedStatus) {
          return { activeOrder: { ...state.activeOrder, orderStatus: mappedStatus } };
        }
        return {};
      });
    };

    // 1. Direct check on mount (immediate) — catch stale localStorage orders
    const doImmediateCheck = async () => {
      try {
        const { data } = await supabase
          .from('Transaction')
          .select('orderStatus')
          .eq('id', currentOrderId)
          .maybeSingle();

        if (data?.orderStatus) {
          handleStatusUpdate(data.orderStatus);
        } else if (!data) {
          // Order not found in DB (e.g. deleted or stale test order) — clear activeOrder so floating pill disappears
          console.log(`[FloatingOrderStatus] Order ${currentOrderId} not found in DB. Auto-clearing activeOrder.`);
          setActiveOrder(null);
        }
      } catch (e) {
        console.warn('[FloatingOrderStatus] Immediate status check failed:', e);
      }
    };

    doImmediateCheck();

    // 2. Supabase Realtime WebSocket — instant push on Kasir App updates
    const channel = supabase
      .channel(`floating_order_watch_${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Transaction',
          filter: `id=eq.${currentOrderId}`,
        },
        (payload: any) => {
          if (payload.new?.orderStatus) {
            handleStatusUpdate(payload.new.orderStatus);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    // 3. Fallback polling every 15s (covers cases where Realtime channel drops)
    const interval = setInterval(doImmediateCheck, 15000);
    pollingIntervalRef.current = interval;

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
      realtimeChannelRef.current = null;
      pollingIntervalRef.current = null;
    };
  }, [activeOrder?.orderId, setActiveOrder]);

  // Don't render if no active order or modals are open
  if (!activeOrder || isOrderStatusOpen || isCheckoutOpen || isCartOpen) {
    return null;
  }

  const status = activeOrder.orderStatus || 'PENDING';

  // Don't render if already completed
  if (status === 'COMPLETED') return null;

  let statusText = 'Pesanan Terkirim';
  let badgeColor = 'bg-amber-500 text-white';
  let Icon = Clock;
  let pulse = true;

  if (status === 'PENDING') {
    statusText = 'Menunggu Kasir Menerima...';
    badgeColor = 'bg-amber-500 text-white';
    Icon = Clock;
  } else if (status === 'CONFIRMED') {
    statusText = 'Pesanan Diterima Kasir ✓';
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
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-amber-300">
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
