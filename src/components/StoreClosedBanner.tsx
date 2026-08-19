'use client';

import React from 'react';
import { Clock, AlertCircle, Phone, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { OFFICIAL_STORE_WA } from '@/types/pos';

export const StoreClosedBanner: React.FC = () => {
  const { storeSettings, isStoreOpen } = useCartStore();

  const isOpen = isStoreOpen();
  if (isOpen) return null;

  const openTime = storeSettings?.openTime || '08:00';
  const closeTime = storeSettings?.closeTime || '22:00';
  const closedReason = storeSettings?.closedReason || 'Kedai sedang istirahat / tutup sementara.';

  const waUrl = `https://wa.me/62${OFFICIAL_STORE_WA.replace(/^0/, '')}?text=${encodeURIComponent(
    `Halo Kedai Nyamleng, saya ingin menanyakan jadwal buka kedai dan pemesanan menu.`
  )}`;

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-white/20 animate-fade-in space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/20 rounded-2xl shrink-0 backdrop-blur-xs">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/25 text-white">
              Toko Sedang Tutup
            </span>
            <span className="text-xs font-semibold text-white/90 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Jam Operasional: {openTime} - {closeTime} WIB
            </span>
          </div>

          <h3 className="font-extrabold text-sm sm:text-base mt-1 leading-snug">
            {closedReason}
          </h3>

          <p className="text-[11px] sm:text-xs text-white/80 mt-1 leading-relaxed">
            Anda tetap dapat melihat daftar menu dan harga. Pemesanan online melalui web akan dibuka kembali sesuai jam operasional kedai.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-white/90 font-medium">
          Ada pertanyaan atau pesanan dalam jumlah besar (katering)?
        </span>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hubungi via WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
