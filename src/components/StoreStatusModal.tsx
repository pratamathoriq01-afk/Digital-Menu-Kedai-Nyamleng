'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  Store, 
  Check, 
  AlertCircle, 
  Power, 
  Calendar, 
  MessageSquare,
  Sparkles,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface StoreStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreStatusModal: React.FC<StoreStatusModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { storeSettings, updateStoreSettings, isStoreOpen } = useCartStore();

  const [isOpenManual, setIsOpenManual] = useState<boolean>(true);
  const [openTime, setOpenTime] = useState<string>('08:00');
  const [closeTime, setCloseTime] = useState<string>('22:00');
  const [isAutoSchedule, setIsAutoSchedule] = useState<boolean>(true);
  const [closedReason, setClosedReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (storeSettings) {
      setIsOpenManual(storeSettings.isOpen !== undefined ? Boolean(storeSettings.isOpen) : true);
      setOpenTime(storeSettings.openTime || '08:00');
      setCloseTime(storeSettings.closeTime || '22:00');
      setIsAutoSchedule(storeSettings.isAutoSchedule !== undefined ? Boolean(storeSettings.isAutoSchedule) : true);
      setClosedReason(storeSettings.closedReason || 'Kedai sedang istirahat / tutup sementara.');
    }
  }, [storeSettings, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg(null);

    const success = await updateStoreSettings({
      isOpen: isOpenManual,
      openTime,
      closeTime,
      isAutoSchedule,
      closedReason,
    });

    setIsSaving(false);

    if (success) {
      setSaveSuccessMsg('Status & Jam Operasional Toko Berhasil Diperbarui!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 1500);
    } else {
      alert('Gagal menyimpan pengaturan ke Supabase. Coba periksa koneksi internet Anda.');
    }
  };

  const currentlyOpen = isStoreOpen();

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      showCloseButton={false}
      desktopClassName="sm:max-w-lg p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white"
      mobileClassName="max-h-[90vh] p-0 overflow-hidden rounded-t-3xl border-none shadow-2xl bg-white"
    >
      <div className="flex flex-col h-full overflow-hidden bg-white text-slate-900">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Kontrol Jam &amp; Status Toko</h2>
              <p className="text-xs text-gray-400">Pengaturan Jam Buka/Tutup Terintegrasi Realtime</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-full transition-colors cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Current Live Status Pill */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            currentlyOpen 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${currentlyOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <div>
                <p className="font-extrabold text-sm">
                  Status Saat Ini: {currentlyOpen ? '🟢 TOKO BUKA (Menerima Pesanan)' : '🔴 TOKO SEDANG TUTUP'}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {currentlyOpen 
                    ? `Pesanan online aktif sesuai jam operasional (${openTime} - ${closeTime} WIB).`
                    : `Menu digital menampilkan banner tutup & menahan checkout.`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Manual Override Switch */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Saklar Status Toko (Override Manual)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsOpenManual(true)}
                className={`py-3 px-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isOpenManual 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>BUKA TOKO</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpenManual(false)}
                className={`py-3 px-4 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  !isOpenManual 
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-102' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>TUTUP SEMENTARA</span>
              </button>
            </div>
          </div>

          {/* Operating Hours Settings */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Jam Operasional Harian (WIB)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> Jam Buka:
                </span>
                <input
                  type="time"
                  required
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full p-2.5 text-sm font-extrabold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" /> Jam Tutup:
                </span>
                <input
                  type="time"
                  required
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full p-2.5 text-sm font-extrabold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-center"
                />
              </div>
            </div>

            {/* Auto Schedule Checkbox */}
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isAutoSchedule}
                onChange={(e) => setIsAutoSchedule(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span>Aktifkan Jadwal Otomatis (Tutup otomatis jika di luar jam operasional)</span>
            </label>
          </div>

          {/* Custom Announcement Note for Closed Store */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              3. Pesan Pengumuman saat Toko Tutup (Opsional)
            </label>

            <textarea
              rows={2}
              value={closedReason}
              onChange={(e) => setClosedReason(e.target.value)}
              placeholder="Contoh: Sedang istirahat siang, buka kembali pukul 16:00 WIB..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed"
            />
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan ke Supabase...' : 'Simpan Pengaturan Toko'}</span>
            </button>
          </div>
        </form>
      </div>
    </ResponsiveModal>
  );
};
