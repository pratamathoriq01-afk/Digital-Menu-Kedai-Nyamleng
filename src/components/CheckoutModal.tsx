'use client';

import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Phone, 
  Mail, 
  Bike, 
  Ticket, 
  ChevronRight, 
  CheckCircle2, 
  Tag,
  Download 
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { DeliveryCourier } from '@/types/pos';
import { PromoVoucherModal } from './PromoVoucherModal';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    toggleCheckout,
    customerName,
    customerEmail,
    customerPhone,
    setCustomerInfo,
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
  } = useCartStore();

  const [nameInput, setNameInput] = useState(customerName || '');
  const [emailInput, setEmailInput] = useState(customerEmail || '');
  const [phoneInput, setPhoneInput] = useState(customerPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  const total = getTotalAmount();
  const subtotal = getSubtotal();
  const tax = getTaxAmount();
  const discount = getDiscountAmount();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadQRIS = async () => {
    try {
      const qrisUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=KEDAI_NYAMLENG_MALANG_QRIS_STATIS';
      const response = await fetch(qrisUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Kedai_Nyamleng_QRIS_Statis.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      alert('Gagal mengunduh gambar QRIS. Silakan screenshot layar HP Anda.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsSubmitting(true);
    setCustomerInfo(nameInput, emailInput, phoneInput);
    
    setTimeout(async () => {
      await submitOrder();
      setIsSubmitting(false);
    }, 800);
  };

  const couriers: { id: DeliveryCourier; name: string; desc: string; badge: string }[] = [
    { id: 'GRAB_SEND', name: 'GrabSend Instant', desc: 'Pengiriman instan & teracak aman', badge: 'Tercepat' },
    { id: 'GO_SEND', name: 'GoSend Instant', desc: 'Pengiriman kurir Gojek langsung', badge: 'Populer' },
    { id: 'INDRIVE', name: 'InDrive Courier', desc: 'Layanan kurir instan hemat', badge: 'Hemat' },
    { id: 'SHOPEE_SPX', name: 'Shopee SPX Instant', desc: 'Pengiriman ekspres Shopee Xpress', badge: 'Ekspres' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
        <div 
          className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-charcoal text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="font-extrabold text-base">Konfirmasi Pembayaran</h2>
                <p className="text-[11px] text-gray-300">
                  Mode Order: <span className="text-amber-300 font-bold">{orderType === 'TAKEAWAY' ? 'Takeaway (Ambil di Toko)' : 'Delivery (Antar Pesanan)'}</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleCheckout(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 text-charcoal">
            
            {/* Customer Personal Details */}
            <div className="space-y-3 bg-parchment-soft p-4 rounded-2xl border border-parchment-border">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Data Pribadi Pemesan
              </h3>

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-charcoal">
                  Nama Lengkap / Panggilan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500"
                  />
                </div>
              </div>

              {/* No WhatsApp */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-charcoal">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-500 font-normal ml-1">(Untuk notifikasi dari 085113661387)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500"
                  />
                </div>
              </div>

              {/* Email Pembeli */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-charcoal">
                  Email Pembeli <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-500 font-normal ml-1">(Untuk ringkasan dari kedainyamleng03@gmail.com)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="Contoh: budi@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Courier Selector (Only if OrderType === 'DELIVERY') */}
            {orderType === 'DELIVERY' && (
              <div className="space-y-3 bg-nyamleng-50/70 p-4 rounded-2xl border border-nyamleng-200">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-nyamleng-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-nyamleng-700">
                    Pilih Layanan Kurir Delivery
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {couriers.map((c) => {
                    const isSelected = deliveryCourier === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setDeliveryCourier(c.id)}
                        className={`flex items-start justify-between p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-nyamleng-500 bg-white text-nyamleng-600 shadow-sm ring-2 ring-nyamleng-500'
                            : 'border-parchment-border bg-white/80 hover:bg-white text-gray-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{c.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-normal block mt-0.5">
                            {c.desc}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold bg-nyamleng-100 text-nyamleng-700 px-1.5 py-0.5 rounded">
                          {c.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment Method Selector (100% Full QRIS Statis) */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Metode Pembayaran (QRIS Statis All Payment)
              </h3>

              <div className="p-3.5 rounded-2xl border border-nyamleng-500 bg-nyamleng-50 text-nyamleng-600 shadow-xs ring-1 ring-nyamleng-500 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-nyamleng-500 text-white rounded-xl">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-bold block text-sm">QRIS Statis All Payment</span>
                    <span className="text-[11px] text-gray-500 font-normal">
                      Scan via GoPay, OVO, Dana, ShopeePay, BCA, Mandiri, BRI, BNI
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                  Aktif
                </span>
              </div>
            </div>

            {/* QRIS Statis Graphic Preview + Download Button */}
            <div className="p-4 bg-nyamleng-50 rounded-2xl border border-nyamleng-200 text-center space-y-2.5">
              <div className="inline-block p-2 bg-white rounded-2xl shadow-xs border border-parchment-border">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=KEDAI_NYAMLENG_MALANG_QRIS_STATIS"
                  alt="QRIS Statis Kedai Nyamleng"
                  className="w-36 h-36 mx-auto"
                />
              </div>
              <p className="text-[11px] font-bold text-nyamleng-700">
                QRIS Statis Kedai Nyamleng • Dapat di-scan via M-Banking & E-Wallet
              </p>

              <div>
                <button
                  type="button"
                  onClick={handleDownloadQRIS}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-nyamleng-500 hover:bg-nyamleng-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Gambar QRIS (PNG)</span>
                </button>
              </div>
            </div>

            {/* Promos or Vouchers Trigger Bar */}
            <div className="space-y-1">
              {!appliedVoucher ? (
                <button
                  type="button"
                  onClick={() => toggleVoucherModal(true)}
                  className="w-full flex items-center justify-between p-3.5 bg-rose-50/80 hover:bg-rose-100/70 border border-rose-200 rounded-2xl text-xs transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 font-extrabold text-rose-600">
                    <div className="p-1.5 bg-rose-500 text-white rounded-xl group-hover:scale-105 transition-transform">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span>% Add Promos or Vouchers</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="w-full flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-emerald-900 block">
                        Voucher {appliedVoucher.code} Aktif
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        {appliedVoucher.title} (-{formatRupiah(discount)})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={removeVoucher}
                    className="text-xs font-extrabold text-rose-600 hover:text-rose-700 underline px-2 py-1"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>

            {/* Final Order Summary */}
            <div className="p-4 bg-parchment-soft rounded-2xl border border-parchment-border space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} menu)</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Diskon Voucher ({appliedVoucher?.code})</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Pajak (PB1 10%)</span>
                <span>{formatRupiah(tax)}</span>
              </div>

              <div className="pt-2 border-t border-parchment-border flex justify-between items-center text-sm font-extrabold text-charcoal">
                <span>Total Pembayaran</span>
                <span className="text-base text-nyamleng-600">{formatRupiah(total)}</span>
              </div>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-nyamleng-500 hover:bg-nyamleng-600 active:scale-98 text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menghubungkan ke POS Kasir Kedai...</span>
              ) : (
                <>
                  <span>Konfirmasi & Bayar QRIS ({formatRupiah(total)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Promo & Voucher Selector Modal */}
      <PromoVoucherModal />
    </>
  );
};
