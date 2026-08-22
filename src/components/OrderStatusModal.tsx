'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  CheckCircle2, 
  Copy, 
  Bell, 
  Bike, 
  ShoppingBag, 
  ShieldCheck, 
  Check,
  ChefHat,
  Flame,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { OFFICIAL_STORE_WA, OrderStatus, STORE_LOCATION } from '@/types/pos';
import { supabase } from '@/lib/supabaseClient';
import { useBodyScrollLock } from '@/lib/scrollLock';

// Status values from Kasir App that mean the order is fully completed
const KASIR_COMPLETED_STATUSES = ['COMPLETED', 'ORDER_FINISH', 'FINISH', 'DONE'];

export const OrderStatusModal: React.FC = () => {
  const { isOrderStatusOpen, toggleOrderStatus, activeOrder, setActiveOrder } = useCartStore();
  useBodyScrollLock(isOrderStatusOpen);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>('PENDING');
  const [isCopied, setIsCopied] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Client-side Notification Deduplication Tracker
  const dispatchedStatusesRef = useRef<Set<string>>(new Set());

  // Mounted Hydration Safety Guard & Active Order Sync
  useEffect(() => {
    setIsMounted(true);
    if (activeOrder) {
      setCurrentStatus(activeOrder.orderStatus || 'PENDING');

      // Realtime listener for active order status changes from Kasir App
      const channel = supabase
        .channel(`order_status_modal_${activeOrder.orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Transaction',
            filter: `id=eq.${activeOrder.orderId}`,
          },
          (payload: any) => {
            const updated = payload.new;
            if (updated && updated.orderStatus) {
              const rawStatus = updated.orderStatus.toUpperCase();

              // If Kasir marks order as COMPLETED/FINISH → auto-clear and close modal
              if (KASIR_COMPLETED_STATUSES.includes(rawStatus)) {
                console.log(`[OrderStatusModal] Order completed by Kasir. Clearing activeOrder.`);
                setActiveOrder(null);
                toggleOrderStatus(false);
                return;
              }

              setCurrentStatus(updated.orderStatus);
              useCartStore.setState((state) => ({
                activeOrder: state.activeOrder ? { ...state.activeOrder, orderStatus: updated.orderStatus } : null,
              }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeOrder, setActiveOrder, toggleOrderStatus]);


  // Realtime Timestamp Tracker (Seconds elapsed since order creation)
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Helper to send real-time progress updates to customer's WhatsApp (Deduplicated)
  const sendWhatsAppProgressUpdate = async (status: OrderStatus) => {
    if (!activeOrder || !activeOrder.customerPhone) return;

    const notifKey = `${activeOrder.orderId}_${status}`;
    if (dispatchedStatusesRef.current.has(notifKey)) {
      console.log(`[Client WA Deduplication] ${notifKey} already dispatched. Suppressing duplicate.`);
      return;
    }

    try {
      dispatchedStatusesRef.current.add(notifKey);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      await fetch(`${baseUrl}/api/whatsapp/notify-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeOrder.orderId,
          customerName: activeOrder.customerName,
          customerPhone: activeOrder.customerPhone,
          status,
          orderType: activeOrder.orderType,
          deliveryCourier: activeOrder.deliveryCourier,
        }),
      });
      console.log(`[WA Progress Notify Sent]: Status ${status} for Order #${activeOrder.orderId}`);
    } catch (e) {
      console.error('[WA Progress Notify Error]:', e);
    }
  };

  // Calculate logical prep time in minutes based on ordered items
  const prepTimeMinutes = useMemo(() => {
    if (!activeOrder || activeOrder.items.length === 0) return 7;

    const maxItemPrep = Math.max(
      ...activeOrder.items.map((i) => i.menuItem.preparationTimeMinutes || 7)
    );
    const totalItemQty = activeOrder.items.reduce((acc, i) => acc + i.quantity, 0);

    const calculatedMinutes = Math.min(Math.max(maxItemPrep + Math.floor((totalItemQty - 1) * 1), 7), 18);
    return calculatedMinutes;
  }, [activeOrder]);

  const totalTargetSeconds = prepTimeMinutes * 60; // Exact real-time seconds (e.g. 7 min = 420s)

  // Calculate target ETA completion time (e.g. 05:48 - 05:53 WIB)
  const etaWindowString = useMemo(() => {
    if (!activeOrder) return '';
    const createdDate = new Date(activeOrder.createdAt);
    const targetDate = new Date(createdDate.getTime() + totalTargetSeconds * 1000);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `Selesai ~ ${formatTime(targetDate)} WIB (± ${prepTimeMinutes} Menit)`;
  }, [activeOrder, totalTargetSeconds, prepTimeMinutes]);

  // Realtime 1-Second Clock Ticker
  useEffect(() => {
    if (!isOrderStatusOpen || !activeOrder) return;

    setNowTimestamp(Date.now());
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isOrderStatusOpen, activeOrder]);

  // REAL-TIME SUPABASE DATABASE POLLER: STRICTLY DRIVEN BY CORE KASIR APP BUTTON CLICKS!
  useEffect(() => {
    if (!isOrderStatusOpen || !activeOrder) return;

    const checkSupabaseStatus = async () => {
      try {
        const { data } = await supabase
          .from('Transaction')
          .select('orderStatus')
          .eq('id', activeOrder.orderId)
          .maybeSingle();

        if (data && data.orderStatus) {
          const raw = data.orderStatus.toUpperCase();

          // If Kasir completed this order, auto-clear and close
          if (KASIR_COMPLETED_STATUSES.includes(raw)) {
            console.log(`[OrderStatusModal Poller] Order completed. Clearing activeOrder.`);
            setActiveOrder(null);
            toggleOrderStatus(false);
            return;
          }

          let mappedStatus: OrderStatus = 'PENDING';
          
          if (raw === 'NEW_ORDER' || raw === 'PENDING') {
            mappedStatus = 'PENDING';
          } else if (raw === 'ORDER_ACCEPTED' || raw === 'CONFIRMED' || raw === 'ACCEPTED') {
            mappedStatus = 'CONFIRMED';
          } else if (raw === 'IN_PROCESSED' || raw === 'KITCHEN_PROCESSING' || raw === 'PROCESSED' || raw === 'PROCESSING') {
            mappedStatus = 'KITCHEN_PROCESSING';
          } else if (raw === 'ORDER_FINISH' || raw === 'READY') {
            mappedStatus = 'READY';
          }

          if (mappedStatus !== currentStatus) {
            setCurrentStatus(mappedStatus);
            setNotificationToast(`[POS Update] Status pesanan #${activeOrder.orderId} diperbarui: ${mappedStatus}`);
            sendWhatsAppProgressUpdate(mappedStatus);
          }
        }
      } catch (e) {
        console.error('Supabase Status Check Error:', e);
      }
    };

    checkSupabaseStatus();
    const dbInterval = setInterval(checkSupabaseStatus, 2000);
    return () => clearInterval(dbInterval);
  }, [isOrderStatusOpen, activeOrder, currentStatus]);

  // Derive exact real-time seconds remaining
  const orderTimeMs = activeOrder ? new Date(activeOrder.createdAt).getTime() : Date.now();
  const elapsedSeconds = Math.max(Math.floor((nowTimestamp - orderTimeMs) / 1000), 0);
  const remainingSeconds = Math.max(totalTargetSeconds - elapsedSeconds, 0);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (notificationToast) {
      const timer = setTimeout(() => setNotificationToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationToast]);

  if (!isMounted || !isOrderStatusOpen || !activeOrder) return null;

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(activeOrder.orderId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Progress Bar Percentage (0% - 100%)
  const progressPercent = Math.min(
    Math.round((elapsedSeconds / totalTargetSeconds) * 100),
    100
  );

  // Digital Minute & Second Clock string (e.g. "06:45")
  const formatTimerDigital = (secondsLeft: number) => {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = [
    {
      id: 'PENDING',
      label: 'Menunggu Konfirmasi Kasir',
      desc: 'Pesanan terkirim, menunggu Kasir App menerima order',
    },
    {
      id: 'CONFIRMED',
      label: 'Diterima POS Kasir',
      desc: 'Kasir telah mengonfirmasi & meneruskan ke dapur',
    },
    {
      id: 'KITCHEN_PROCESSING',
      label: 'Dapur Memproses',
      desc: 'Koki sedang memasak pesanan Anda',
    },
    {
      id: 'READY',
      label: activeOrder.orderType === 'DELIVERY' ? 'Siap Dikirim' : 'Siap Ambil',
      desc: activeOrder.orderType === 'DELIVERY' ? 'Kurir mengambil pesanan' : 'Silakan ambil di konter kasir',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in pb-[env(safe-area-inset-bottom)]">
      <div 
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[88dvh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-charcoal text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <div>
              <h2 className="font-extrabold text-base">Status Tracking Pesanan</h2>
              <p className="text-[11px] text-gray-300">
                Lacak Status Dapur Realtime • {activeOrder.orderType === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
              </p>
            </div>
          </div>
          <button
            onClick={() => toggleOrderStatus(false)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Tutup Tracking"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-charcoal">

          {/* Toast Alert Notification */}
          {notificationToast && (
            <div className="p-3 bg-amber-500 text-white rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-md animate-slide-down">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white animate-bounce" />
                <span>{notificationToast}</span>
              </div>
              <button 
                onClick={() => setNotificationToast(null)}
                className="text-white/80 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* WhatsApp Automated AI Assistant Active Banner */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <span>WhatsApp AI Assistant Bintang 5 Aktif</span>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </p>
              <p className="text-emerald-700 text-[11px] mt-0.5 leading-snug">
                Notifikasi otomatis &amp; struk telah dikirim ke WhatsApp <span className="font-bold">({activeOrder.customerPhone || OFFICIAL_STORE_WA})</span>. Anda dapat langsung membalas chat WA untuk bertanya ke AI Admin Kedai!
              </p>
            </div>
          </div>

          {/* Live Order Hero Status Card */}
          <div className="bg-gradient-to-br from-nyamleng-500 to-nyamleng-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4">
            
            {/* Ambient Background Blur */}
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

            {/* Order ID & Copy Action */}
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-200 block">
                  Nomor Transaksi Struk
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-xl font-black tracking-tight">{activeOrder.orderId}</h3>
                  <button
                    onClick={handleCopyOrderId}
                    className="p-1 bg-white/15 hover:bg-white/25 rounded-lg transition-all text-white text-xs flex items-center gap-1 cursor-pointer"
                    title="Salin Nomor Pesanan"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Order Mode Badge */}
              <span className="text-xs font-extrabold bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1.5">
                {activeOrder.orderType === 'DELIVERY' ? (
                  <>
                    <Bike className="w-3.5 h-3.5 text-amber-300" />
                    <span>Delivery</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                    <span>Takeaway</span>
                  </>
                )}
              </span>
            </div>

            {/* Realtime Countdown Timer Clock */}
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 space-y-2 relative z-10 text-center">
              <div className="flex items-center justify-between text-xs text-amber-100 font-semibold">
                <span className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-300" />
                  <span>Estimasi Dapur Kedai</span>
                </span>
                <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                  {etaWindowString}
                </span>
              </div>

              {/* Digital Countdown Timer Display (MM:SS) */}
              <div className="pt-1 flex items-center justify-center gap-3">
                <div className="bg-charcoal/90 text-amber-400 px-4 py-2 rounded-2xl font-mono text-3xl font-black border border-white/20 shadow-inner flex items-center gap-2">
                  <Clock className="w-6 h-6 text-amber-400 animate-spin-slow" />
                  <span>{formatTimerDigital(remainingSeconds)}</span>
                </div>
              </div>

              {/* Realtime Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className="bg-gradient-to-r from-amber-300 to-amber-400 h-full rounded-full transition-all duration-1000 ease-linear shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-amber-100 font-bold px-0.5">
                  <span>Proses Masak: {progressPercent}%</span>
                  <span>
                    {remainingSeconds === 0 ? 'Pesanan Siap!' : `Tersisa ${remainingSeconds} Detik`}
                  </span>
                </div>
              </div>
            </div>

            {/* Kitchen Live Message Footer (Driven Exclusively by POS Kasir App) */}
            <div className="text-center pt-1 text-xs font-semibold text-white/90 relative z-10 flex items-center justify-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>
                {currentStatus === 'PENDING' && '⏳ Pesanan terkirim. Menunggu Kasir menekan "Terima Order" di Kasir App...'}
                {currentStatus === 'CONFIRMED' && '✅ Pesanan telah diterima Kasir! Diteruskan ke dapur...'}
                {currentStatus === 'KITCHEN_PROCESSING' && '🍳 Dapur sedang menggoreng & menyajikan pesanan...'}
                {currentStatus === 'READY' && '🎉 Pesanan selesai dimasak! Siap disajikan.'}
              </span>
            </div>
          </div>

          {/* Stepper Tracking Visualizer */}
          <div className="bg-parchment-soft p-4 rounded-3xl border border-parchment-border space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-500">
              Tahapan Proses Dapur (Dikontrol Kasir POS)
            </h4>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-parchment-border">
              {steps.map((step, idx) => {
                const isDone = 
                  (step.id === 'PENDING' && (currentStatus === 'PENDING' || currentStatus === 'CONFIRMED' || currentStatus === 'KITCHEN_PROCESSING' || currentStatus === 'READY')) ||
                  (step.id === 'CONFIRMED' && (currentStatus === 'CONFIRMED' || currentStatus === 'KITCHEN_PROCESSING' || currentStatus === 'READY')) ||
                  (step.id === 'KITCHEN_PROCESSING' && (currentStatus === 'KITCHEN_PROCESSING' || currentStatus === 'READY')) ||
                  (step.id === 'READY' && currentStatus === 'READY');

                const isCurrent = step.id === currentStatus;

                return (
                  <div key={step.id} className="relative flex items-start gap-3 text-xs">
                    
                    {/* Circle Bullet Node */}
                    <div 
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isDone 
                          ? 'bg-emerald-500 text-white shadow-xs ring-4 ring-emerald-100' 
                          : isCurrent 
                          ? 'bg-nyamleng-500 text-white ring-4 ring-nyamleng-100 animate-pulse' 
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className={`font-bold text-sm ${isCurrent ? 'text-nyamleng-600' : 'text-charcoal'}`}>
                          {step.label}
                        </h5>
                        {isCurrent && (
                          <span className="bg-nyamleng-100 text-nyamleng-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                            Aktif Sekarang
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-[11px]">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer & Store Details Card */}
          <div className="p-4 bg-white rounded-3xl border border-parchment-border space-y-3 text-xs text-charcoal">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-parchment-border">
              Rincian Pemesan &amp; Lokasi Kedai
            </h4>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-gray-400 block font-medium">Nama Pemesan:</span>
                <span className="font-bold text-charcoal text-xs">{activeOrder.customerName}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">WhatsApp Notification:</span>
                <span className="font-bold text-charcoal text-xs">{activeOrder.customerPhone || OFFICIAL_STORE_WA}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Metode Bayar:</span>
                <span className="font-bold text-nyamleng-600 text-xs">
                  QRIS Dinamis (LUNAS)
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Lokasi Kedai:</span>
                <span className="font-bold text-charcoal text-xs">{STORE_LOCATION}</span>
              </div>
            </div>

            {/* Delivery Address & Notes if present */}
            {activeOrder.orderNotes && (
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <span className="font-bold block text-amber-800">Catatan / Alamat Pengiriman:</span>
                <p className="mt-0.5 font-medium">{activeOrder.orderNotes}</p>
              </div>
            )}

            {/* Direct WhatsApp Confirmation Button */}
            <div className="pt-2 border-t border-parchment-border">
              <button
                type="button"
                onClick={() => {
                  const storeWA = OFFICIAL_STORE_WA.replace(/\D/g, '').replace(/^0/, '62');
                  const itemsText = (activeOrder.items || []).map(i => `• ${i.quantity}x ${i.menuItem.name} (Rp ${i.itemSubtotal.toLocaleString('id-ID')})`).join('\n');
                  const waText = `Halo Kasir Kedai Nyamleng! Saya sudah melakukan checkout di Menu Digital:\n\n` +
                    `📌 *No. Pesanan:* #${activeOrder.orderId}\n` +
                    `👤 *Nama:* ${activeOrder.customerName}\n` +
                    `📱 *No. WhatsApp:* ${activeOrder.customerPhone || '-'}\n` +
                    `📦 *Tipe Pesanan:* ${activeOrder.orderType === 'DELIVERY' ? `Delivery (${activeOrder.deliveryCourier || 'Instant'})` : 'Takeaway (Ambil di Toko)'}\n` +
                    (activeOrder.orderNotes ? `📍 *Alamat / Catatan:* ${activeOrder.orderNotes}\n` : '') +
                    `\n🛒 *Rincian Menu:*\n${itemsText}\n\n` +
                    `💰 *Total Tagihan:* Rp ${activeOrder.totalAmount.toLocaleString('id-ID')} (QRIS Lunas)\n\n` +
                    `Mohon segera diproses ya kak, terima kasih!`;

                  window.open(`https://wa.me/${storeWA}?text=${encodeURIComponent(waText)}`, '_blank');
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Kirim Konfirmasi Pesanan ke WhatsApp Kedai</span>
              </button>
            </div>

            {/* Email Dispatch Info */}
            <div className="pt-2 border-t border-parchment-border flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>E-Receipt dikirim ke {activeOrder.customerEmail}</span>
              </span>
            </div>
          </div>

        </div>

        {/* Clean Footer Action */}
        <div className="p-4 bg-white border-t border-parchment-border flex flex-col items-center justify-end pb-[calc(1rem+env(safe-area-inset-bottom))] gap-2">
          <button
            onClick={() => {
              setActiveOrder(null);
              toggleOrderStatus(false);
            }}
            className="w-full py-3 px-6 bg-nyamleng-600 hover:bg-nyamleng-700 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{currentStatus === 'READY' || currentStatus === 'COMPLETED' ? '✅ Selesai & Simpan ke Riwayat Pesanan' : 'Tutup Tracking & Simpan ke Riwayat'}</span>
          </button>
        </div>
      </div>
    </div>
  );

};
