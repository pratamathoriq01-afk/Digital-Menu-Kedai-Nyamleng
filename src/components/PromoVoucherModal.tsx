'use client';

import React, { useState } from 'react';
import { X, ArrowLeft, Ticket, CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Voucher } from '@/types/pos';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

export const PromoVoucherModal: React.FC = () => {
  const {
    isVoucherModalOpen,
    toggleVoucherModal,
    availableVouchers,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    getSubtotal,
  } = useCartStore();

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const subtotal = getSubtotal();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSelectVoucher = (v: Voucher) => {
    if (appliedVoucher?.code === v.code) {
      removeVoucher();
      setFeedback({ success: true, message: `Voucher "${v.title}" dilepas.` });
      return;
    }

    const result = applyVoucher(v.code);
    setFeedback(result);
  };

  return (
    <ResponsiveModal
      open={isVoucherModalOpen}
      onOpenChange={(open) => !open && toggleVoucherModal(false)}
      showCloseButton={false}
      desktopClassName="sm:max-w-md p-0 overflow-hidden rounded-3xl border-none shadow-2xl bg-white"
      mobileClassName="max-h-[90vh] p-0 overflow-hidden rounded-t-3xl border-none shadow-2xl bg-white"
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-parchment-border flex items-center justify-between shadow-xs shrink-0">
          <button
            onClick={() => toggleVoucherModal(false)}
            className="p-1.5 hover:bg-parchment-soft rounded-full text-charcoal transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-charcoal" />
          </button>

          <h2 className="font-extrabold text-base text-charcoal flex items-center gap-1.5">
            <Ticket className="w-5 h-5 text-nyamleng-500" />
            <span>Pilih Voucher Diskon Makanan</span>
          </h2>

          <button
            onClick={() => toggleVoucherModal(false)}
            className="p-1.5 hover:bg-parchment-soft rounded-full text-gray-400 hover:text-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-charcoal">
          
          {/* Subtitle Info Banner */}
          <div className="bg-nyamleng-50 border border-nyamleng-200 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-nyamleng-800">
            <Sparkles className="w-4 h-4 text-nyamleng-600 flex-shrink-0" />
            <span>Voucher diskon khusus makanan & minuman Kedai Nyamleng. Pilih 1-tap untuk memakai diskon!</span>
          </div>

          {/* Feedback Alert Toast */}
          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-fade-in ${
                feedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{feedback.message}</span>
            </div>
          )}

          {/* Available Vouchers Container */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-500">
                Voucher Makanan & Minuman ({availableVouchers.length})
              </h3>
            </div>

            {availableVouchers.map((v) => {
              const isApplied = appliedVoucher?.code === v.code;
              const isEligible = subtotal >= v.minSubtotal;

              return (
                <div
                  key={v.code}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    isApplied
                      ? 'bg-nyamleng-50/90 border-nyamleng-500 shadow-md ring-2 ring-nyamleng-400'
                      : isEligible
                      ? 'bg-white border-parchment-border shadow-xs hover:border-nyamleng-300'
                      : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  {/* Voucher Card Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-nyamleng-700 bg-nyamleng-100 px-2.5 py-0.5 rounded-full border border-nyamleng-200">
                          {v.code}
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          Diskon Menu
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-charcoal">{v.title}</h4>
                    </div>

                    {/* 1-Tap Action Button */}
                    <button
                      onClick={() => handleSelectVoucher(v)}
                      className={`py-2 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1 ${
                        isApplied
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-nyamleng-500 hover:bg-nyamleng-600 text-white active:scale-95 shadow-xs'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terpakai</span>
                        </>
                      ) : (
                        <span>Gunakan Voucher</span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-600">{v.description}</p>

                  {/* Expiry Date & Condition Footer */}
                  <div className="pt-2 border-t border-parchment-border flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-nyamleng-500" />
                      <span>Berlaku s.d. {v.validUntil}</span>
                    </span>

                    <span className="font-bold text-gray-600">
                      Min. {formatRupiah(v.minSubtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-parchment-border shrink-0">
          <button
            onClick={() => toggleVoucherModal(false)}
            className="w-full py-3.5 px-4 bg-nyamleng-500 hover:bg-nyamleng-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
