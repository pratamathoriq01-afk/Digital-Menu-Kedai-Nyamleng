'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  Bike, 
  CheckCircle2, 
  Download, 
  ArrowLeft, 
  Edit3, 
  Lock, 
  Copy, 
  Clock, 
  Sparkles,
  MapPin,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { DeliveryCourier, OFFICIAL_STORE_WA, OrderPayload } from '@/types/pos';
import { PromoVoucherModal } from './PromoVoucherModal';
import { getStoredCustomerUser } from '@/services/authService';
import { useBodyScrollLock } from '@/lib/scrollLock';
import { generateDynamicQRIS } from '@/lib/qrisHelper';
import { supabase } from '@/lib/supabaseClient';
import { playSuccessChime, requestPushNotificationPermission } from '@/lib/notificationHelper';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    toggleCheckout,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    addressNotes,
    setCustomerInfo,
    setDeliveryAddress,
    orderType,
    deliveryCourier,
    setDeliveryCourier,
    cartItems,
    getSubtotal,
    getTaxAmount,
    getDiscountAmount,
    getTotalAmount,
    appliedVoucher,
    removeVoucher,
    toggleVoucherModal,
    submitOrder,
    pendingPaymentOrder,
    setPendingPaymentOrder,
    clearPendingPayment,
  } = useCartStore();

  useBodyScrollLock(isCheckoutOpen);

  const [checkoutStep, setCheckoutStep] = useState<'FORM' | 'QRIS_PAYMENT'>('FORM');
  const [nameInput, setNameInput] = useState(customerName || '');
  const [emailInput, setEmailInput] = useState(customerEmail || '');
  const [phoneInput, setPhoneInput] = useState(customerPhone || '');
  const [addressInput, setAddressInput] = useState(deliveryAddress || '');
  const [addressNotesInput, setAddressNotesInput] = useState(addressNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSynced, setIsGoogleSynced] = useState(false);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 menit countdown
  const [paymentSuccessCelebration, setPaymentSuccessCelebration] = useState(false);
  const activePendingIdRef = useRef<string | null>(null);

  const OFFICIAL_QRIS_PAYLOAD = 
    process.env.NEXT_PUBLIC_QRIS_STRING || 
    process.env.NEXT_PUBLIC_QRIS_STRING_KEDAI ||
    '00020101021126610014COM.GO-JEK.WWW01189360091439239121390210G9239121390303UMI51440014ID.CO.QRIS.WWW0215ID10265488213900303UMI5204581253033605802ID5924Kedai Nyamleng, BLIMBING6006MALANG61056512662070703A0163040BF6';

  // Request browser push notification on checkout open
  useEffect(() => {
    if (isCheckoutOpen) {
      requestPushNotificationPermission().catch(() => {});
    }
  }, [isCheckoutOpen]);

  // Auto-fill Customer Profile from Google Auth Session on Mount/Open
  useEffect(() => {
    if (!isCheckoutOpen) return;
    const googleUser = getStoredCustomerUser();
    if (googleUser) {
      if (!nameInput) setNameInput(googleUser.name);
      if (!emailInput) setEmailInput(googleUser.email);
      if (!phoneInput && googleUser.phone) setPhoneInput(googleUser.phone);
      setIsGoogleSynced(true);
    }
  }, [isCheckoutOpen]);

  // Restore pending payment session if exists (Session Hold for M-Banking switch)
  useEffect(() => {
    if (isCheckoutOpen && pendingPaymentOrder) {
      setCheckoutStep('QRIS_PAYMENT');
      activePendingIdRef.current = pendingPaymentOrder.orderId;
    }
  }, [isCheckoutOpen, pendingPaymentOrder]);

  // Payment Countdown Timer
  useEffect(() => {
    if (checkoutStep !== 'QRIS_PAYMENT') {
      setTimeLeft(900);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [checkoutStep]);

  // Auto-Payment Realtime Detection & Background Tab Switch Listener
  useEffect(() => {
    if (checkoutStep !== 'QRIS_PAYMENT' || !activePendingIdRef.current) return;

    const currentOrderId = activePendingIdRef.current;

    const handlePaymentVerified = async () => {
      setPaymentSuccessCelebration(true);
      playSuccessChime();

      // 2 seconds transition delay to celebrate and inform customer
      setTimeout(async () => {
        setPaymentSuccessCelebration(false);
        setCheckoutStep('FORM');
        clearPendingPayment();
        await submitOrder('QRIS');
      }, 2000);
    };

    // 1. Supabase Realtime WebSocket Channel Listener
    const channel = supabase
      .channel(`qris_payment_watch_${currentOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Transaction',
          filter: `id=eq.${currentOrderId}`,
        },
        (payload: any) => {
          const updated = payload.new;
          if (updated && (updated.paymentStatus === 'PAID' || updated.orderStatus !== 'PENDING')) {
            handlePaymentVerified();
          }
        }
      )
      .subscribe();

    // 2. Instant Re-check on Window Focus / Visibility Change (when customer returns from m-banking)
    const checkStatusDirectly = async () => {
      try {
        const { data } = await supabase
          .from('Transaction')
          .select('paymentStatus, orderStatus')
          .eq('id', currentOrderId)
          .single();

        if (data && (data.paymentStatus === 'PAID' || data.orderStatus !== 'PENDING')) {
          handlePaymentVerified();
        }
      } catch (e) {
        console.warn('Direct payment status check error:', e);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatusDirectly();
      }
    };

    window.addEventListener('focus', checkStatusDirectly);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check
    checkStatusDirectly();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', checkStatusDirectly);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkoutStep, submitOrder, clearPendingPayment]);

  if (!isCheckoutOpen) return null;

  const total = getTotalAmount();
  const subtotal = getSubtotal();
  const tax = getTaxAmount();
  const discount = getDiscountAmount();

  // Generate Dynamic QRIS with exact order total
  const dynamicQRISPayload = generateDynamicQRIS(OFFICIAL_QRIS_PAYLOAD, total);
  const qrisImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(dynamicQRISPayload)}`;

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(Math.round(total).toString());
    setCopiedNominal(true);
    setTimeout(() => setCopiedNominal(false), 2000);
  };

  const handleDownloadQRIS = async () => {
    try {
      const response = await fetch(qrisImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Kedai_Nyamleng_QRIS_Rp${Math.round(total)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert('Gagal mengunduh gambar QRIS. Silakan screenshot layar HP Anda.');
    }
  };

  const handleProceedToQRISStep = (e: React.FormEvent) => {
    e.preventDefault();

    const { isStoreOpen, storeSettings } = useCartStore.getState();
    if (!isStoreOpen()) {
      const reason = storeSettings?.closedReason || 'Kedai saat ini sedang tutup / di luar jam operasional.';
      alert(`Mohon maaf, toko sedang tutup.\n\n${reason}\n\nJam Buka: ${storeSettings?.openTime || '08:00'} - ${storeSettings?.closeTime || '22:00'} WIB`);
      return;
    }

    if (!nameInput.trim()) {
      alert('Tolong isi nama Anda terlebih dahulu');
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      alert('Tolong masukkan alamat email yang valid');
      return;
    }
    if (!phoneInput.trim()) {
      alert('Tolong masukkan nomor WhatsApp Anda terlebih dahulu');
      return;
    }
    if (orderType === 'DELIVERY' && !addressInput.trim()) {
      alert('Tolong masukkan alamat lengkap pengiriman untuk pesanan Delivery');
      return;
    }

    setCustomerInfo(nameInput, emailInput, phoneInput);
    if (orderType === 'DELIVERY') {
      setDeliveryAddress(addressInput, addressNotesInput);
    }

    // Initialize Pending Payment Session
    const orderId = `KDN-${Date.now().toString().slice(-6)}`;
    activePendingIdRef.current = orderId;

    let fullNotes = '';
    if (orderType === 'DELIVERY') {
      fullNotes = `Alamat: ${addressInput}${addressNotesInput ? ` (Patokan: ${addressNotesInput})` : ''}`;
    }

    const pendingOrderPayload: OrderPayload = {
      orderId,
      customerName: nameInput,
      customerEmail: emailInput,
      customerPhone: phoneInput,
      orderType,
      deliveryCourier: orderType === 'DELIVERY' ? deliveryCourier : undefined,
      orderNotes: fullNotes,
      items: cartItems,
      subtotal,
      taxAmount: tax,
      serviceFee: 0,
      discountAmount: discount,
      appliedVoucherCode: appliedVoucher?.code,
      totalAmount: total,
      paymentMethod: 'QRIS',
      paymentStatus: 'PAID',
      orderStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      posSyncStatus: 'SYNCED',
    };

    setPendingPaymentOrder(pendingOrderPayload);
    setCheckoutStep('QRIS_PAYMENT');
  };

  const handleManualConfirmPaid = async () => {
    setIsSubmitting(true);
    setPaymentSuccessCelebration(true);
    playSuccessChime();

    setTimeout(async () => {
      try {
        await submitOrder('QRIS');
        setCheckoutStep('FORM');
        clearPendingPayment();
      } catch (err) {
        console.error('Order Submission Error:', err);
      } finally {
        setIsSubmitting(false);
        setPaymentSuccessCelebration(false);
      }
    }, 1500);
  };

  const couriers: { id: DeliveryCourier; name: string; desc: string; badge: string }[] = [
    { id: 'GRAB_SEND', name: 'GrabSend Instant', desc: 'Pengiriman instan & teracak aman', badge: 'Tercepat' },
    { id: 'GO_SEND', name: 'GoSend Instant', desc: 'Pengiriman kurir Gojek langsung', badge: 'Populer' },
    { id: 'INDRIVE', name: 'InDrive Courier', desc: 'Layanan kurir instan hemat', badge: 'Hemat' },
    { id: 'SHOPEE_SPX', name: 'Shopee SPX Instant', desc: 'Pengiriman ekspres Shopee Xpress', badge: 'Ekspres' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in pb-[env(safe-area-inset-bottom)]">
        <div 
          className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[90dvh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-charcoal text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {checkoutStep === 'QRIS_PAYMENT' ? (
                <button
                  type="button"
                  onClick={() => setCheckoutStep('FORM')}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors mr-1"
                  title="Kembali ke Form"
                >
                  <ArrowLeft className="w-5 h-5 text-amber-300" />
                </button>
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
              <div>
                <h2 className="font-extrabold text-base">
                  {checkoutStep === 'FORM' ? 'Detail Pesanan & Promo' : 'Scan Pembayaran QRIS Dinamis'}
                </h2>
                <p className="text-[11px] text-gray-300">
                  Mode: <span className="text-amber-300 font-bold">{orderType === 'TAKEAWAY' ? 'Takeaway (Ambil di Toko)' : 'Delivery (Kurir Antar)'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                toggleCheckout(false);
                if (!pendingPaymentOrder) {
                  setCheckoutStep('FORM');
                }
              }}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* STEP 1: FORM & VOUCHER PROMO */}
          {checkoutStep === 'FORM' && (
            <form onSubmit={handleProceedToQRISStep} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-charcoal">
              
              {/* Customer Personal Details */}
              <div className="space-y-3 bg-parchment-soft p-3.5 sm:p-4 rounded-2xl border border-parchment-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Data Pemesan & Kontak
                  </h3>
                  {isGoogleSynced && (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Google Auto-Fill</span>
                    </span>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-charcoal">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500 font-semibold"
                    />
                  </div>
                </div>

                {/* No WhatsApp */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-charcoal">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500 font-semibold"
                    />
                  </div>
                </div>

                {/* Email Pembeli */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-charcoal">
                    Email (Untuk E-Receipt) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="Contoh: budi@gmail.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs bg-white rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address Section (Only if OrderType === 'DELIVERY') */}
              {orderType === 'DELIVERY' && (
                <div className="space-y-3 bg-amber-50/60 p-3.5 sm:p-4 rounded-2xl border border-amber-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-nyamleng-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-nyamleng-700">
                      Alamat Lengkap Pengiriman Delivery
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-charcoal">
                      Alamat Jalan, No. Rumah, RT/RW, Kelurahan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Contoh: Jl. Laksda Adi Sucipto No. 45 RT 02/03, Kel. Blimbing, Malang"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      className="w-full p-2.5 text-xs bg-white rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-nyamleng-500 font-medium leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-charcoal">
                      Patokan Lokasi / Catatan Alamat (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rumah pagar hitam samping Masjid / Titip di pos satpam"
                      value={addressNotesInput}
                      onChange={(e) => setAddressNotesInput(e.target.value)}
                      className="w-full p-2 text-xs bg-white rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-nyamleng-500 font-medium"
                    />
                  </div>

                  {/* Delivery Courier Selector */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-charcoal mb-1.5">
                      Pilihan Kurir Instant:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {couriers.map((c) => {
                        const isSelected = deliveryCourier === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setDeliveryCourier(c.id)}
                            className={`flex items-start justify-between p-2 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'border-nyamleng-500 bg-white text-nyamleng-600 shadow-xs ring-2 ring-nyamleng-500'
                                : 'border-parchment-border bg-white/80 hover:bg-white text-gray-700'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-[11px] block">{c.name}</span>
                              <span className="text-[9px] text-gray-500">{c.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Voucher Promo Section */}
              <div className="bg-parchment-soft p-3.5 rounded-2xl border border-parchment-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-nyamleng-500" />
                  <div>
                    <span className="text-xs font-bold block">
                      {appliedVoucher ? appliedVoucher.title : 'Punya Kode Promo / Voucher?'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {appliedVoucher ? `Hemat ${formatRupiah(discount)}` : 'Gunakan voucher diskon makanan'}
                    </span>
                  </div>
                </div>

                {appliedVoucher ? (
                  <button
                    type="button"
                    onClick={removeVoucher}
                    className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50"
                  >
                    Hapus
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleVoucherModal(true)}
                    className="text-xs text-nyamleng-600 hover:text-nyamleng-700 font-bold px-3 py-1.5 rounded-xl bg-nyamleng-100 hover:bg-nyamleng-200"
                  >
                    Pilih Promo
                  </button>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="bg-white p-3.5 rounded-2xl border border-parchment-border space-y-1.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal Pesanan</span>
                  <span className="font-semibold text-charcoal">{formatRupiah(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon Voucher</span>
                    <span>-{formatRupiah(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak Resto (PB1 10%)</span>
                  <span className="font-semibold text-charcoal">{formatRupiah(tax)}</span>
                </div>
                <div className="pt-2 border-t border-parchment-border flex justify-between items-center text-sm font-extrabold text-charcoal">
                  <span>Total Tagihan QRIS</span>
                  <span className="text-base text-nyamleng-600">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Submit Button to QRIS */}
              <button
                type="submit"
                className="w-full py-3.5 bg-nyamleng-600 hover:bg-nyamleng-700 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Lanjut ke Scan QRIS Dinamis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: QRIS DYNAMIC PAYMENT STEP WITH SESSION HOLD & AUTO-DETECTION */}
          {checkoutStep === 'QRIS_PAYMENT' && (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-center text-charcoal">
              
              {/* Payment Success Celebration Overlay */}
              {paymentSuccessCelebration ? (
                <div className="p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-500 space-y-4 animate-scale-up">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-800">Pembayaran Berhasil! 🎉</h3>
                    <p className="text-xs text-emerald-600 mt-1">
                      Sistem telah memverifikasi pembayaran Anda secara realtime. Mengalihkan ke live tracking pesanan...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Session Hold Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-[11px] text-amber-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-left font-semibold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Sesi QRIS terkunci aman (Bebas buka M-Banking / E-Wallet)</span>
                    </div>
                    <span className="font-mono font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-lg shrink-0">
                      {formatTimer(timeLeft)}
                    </span>
                  </div>

                  {/* Nominal Card with Copy Feature */}
                  <div className="bg-parchment-soft p-4 rounded-3xl border border-parchment-border space-y-1">
                    <span className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">
                      Nominal QRIS Dinamis Otomatis
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-nyamleng-600 font-mono">
                        {formatRupiah(total)}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyNominal}
                        className="p-1.5 hover:bg-parchment rounded-xl border border-parchment-border transition-colors text-gray-600 flex items-center gap-1 text-[10px] font-bold"
                        title="Salin Nominal"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedNominal ? 'Tersalin!' : 'Salin'}</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-500 block">
                      *Nominal langsung otomatis muncul saat QRIS discan di M-Banking / GoPay / OVO / Dana / BCA.
                    </span>
                  </div>

                  {/* Dynamic QRIS Image Container */}
                  <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-nyamleng-300 max-w-[280px] sm:max-w-[320px] mx-auto shadow-md space-y-3">
                    <div className="aspect-square bg-white rounded-2xl overflow-hidden flex items-center justify-center p-2">
                      <img 
                        src={qrisImageUrl} 
                        alt="QRIS Dinamis Kedai Nyamleng" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-extrabold text-charcoal bg-nyamleng-50 px-3 py-1 rounded-full inline-block border border-nyamleng-200">
                      NMID: ID1026548821390 • Kedai Nyamleng
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={handleDownloadQRIS}
                      className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-parchment-border text-charcoal font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                      <span>Unduh QRIS</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleManualConfirmPaid}
                      className="py-2.5 px-3 bg-nyamleng-600 hover:bg-nyamleng-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Memproses...' : 'Saya Sudah Bayar'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 max-w-sm mx-auto">
                    💡 Sistem otomatis mendeteksi pembayaran realtime ketika kasir menerima dana. Tidak perlu khawatir jika browser tertutup saat membuka mobile banking.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Promo Voucher Modal */}
      <PromoVoucherModal />
    </>
  );
};
