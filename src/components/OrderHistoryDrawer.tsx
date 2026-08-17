'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  LogOut, 
  User, 
  Clock, 
  CheckCircle2, 
  ShoppingBag, 
  Bike, 
  ChevronRight, 
  ExternalLink,
  Receipt,
  Store
} from 'lucide-react';
import { CustomerUser, setStoredCustomerUser } from '@/services/authService';
import { supabase } from '@/lib/supabaseClient';
import { useCartStore } from '@/store/useCartStore';
import { useBodyScrollLock } from '@/lib/scrollLock';

interface OrderHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerUser | null;
  onLogout: () => void;
}

export const OrderHistoryDrawer: React.FC<OrderHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  useBodyScrollLock(isOpen);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toggleOrderStatus } = useCartStore();

  useEffect(() => {
    if (!isOpen || !currentUser) return;

    const fetchCustomerHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('Transaction')
          .select('*, items:TransactionItem(*)')
          .or(`customerEmail.eq.${currentUser.email},customerUserId.eq.${currentUser.id}`)
          .order('createdAt', { ascending: false });

        if (error) {
          console.error('[Fetch History Error]:', error.message);
        } else {
          setHistoryOrders(data || []);
        }
      } catch (err) {
        console.error('[Fetch History Exception]:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerHistory();
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-sm bg-white h-full flex flex-col overflow-hidden shadow-2xl animate-slide-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Drawer */}
        <div className="p-4 bg-charcoal text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-nyamleng-600 rounded-xl text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">Riwayat Pesanan Saya</h2>
              <p className="text-[10px] text-gray-300">Wadah Transaksi Akun Google</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Customer Account Info Banner */}
        {currentUser ? (
          <div className="p-4 bg-gradient-to-r from-nyamleng-50 to-amber-50 border-b border-parchment-border flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.email)}`}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border-2 border-nyamleng-500 shrink-0 bg-white"
              />
              <div className="min-w-0">
                <h4 className="font-extrabold text-xs text-charcoal truncate">{currentUser.name}</h4>
                <p className="text-[11px] text-gray-500 truncate">{currentUser.email}</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Scrollable Order History List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-parchment-soft">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-400 space-y-2">
              <Clock className="w-8 h-8 animate-spin text-nyamleng-500 mx-auto" />
              <p>Memuat Riwayat Transaksi Supabase...</p>
            </div>
          ) : historyOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 space-y-3 bg-white rounded-2xl p-6 border border-parchment-border">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto" />
              <h4 className="font-bold text-charcoal text-sm">Belum Ada Riwayat Pesanan</h4>
              <p className="text-[11px] text-gray-500">
                Seluruh transaksi yang Anda pesan via akun Google ini akan tersimpan otomatis di sini.
              </p>
            </div>
          ) : (
            historyOrders.map((order) => {
              const isFinished = order.orderStatus === 'READY' || order.orderStatus === 'COMPLETED' || order.orderStatus === 'ORDER_FINISH';

              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl p-4 border border-parchment-border shadow-xs hover:border-nyamleng-300 transition-all space-y-3"
                >
                  {/* Order ID & Date */}
                  <div className="flex items-center justify-between pb-2 border-b border-parchment-border text-xs">
                    <div>
                      <span className="font-extrabold text-charcoal text-sm block">#{order.orderNumber || order.id}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{formatDate(order.createdAt)}</span>
                    </div>

                    {/* Status Badge */}
                    <span 
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isFinished 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isFinished ? 'Selesai' : 'Sedang Diproses'}</span>
                    </span>
                  </div>

                  {/* Order Type & Items Summary */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span className="flex items-center gap-1 font-semibold">
                        {order.orderType === 'DELIVERY' ? <Bike className="w-3.5 h-3.5 text-nyamleng-600" /> : <ShoppingBag className="w-3.5 h-3.5 text-nyamleng-600" />}
                        <span>{order.orderType === 'DELIVERY' ? `Delivery (${order.deliveryCourier || 'Kurir'})` : 'Takeaway (Ambil di Toko)'}</span>
                      </span>
                      <span className="font-bold text-nyamleng-600">{formatRupiah(order.total || 0)}</span>
                    </div>

                    {/* Purchased Items Preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="pt-1 text-[11px] text-gray-600 space-y-0.5 font-medium">
                        {order.items.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.qty}x {item.nameSnapshot}</span>
                            <span className="font-mono text-[10px]">{formatRupiah(item.priceSnapshot * item.qty)}</span>
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <span className="text-[10px] text-gray-400 italic block">
                            +{order.items.length - 2} menu lainnya...
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Store Info */}
        <div className="p-4 bg-white border-t border-parchment-border text-[11px] text-gray-500 space-y-2">
          <div className="flex items-center gap-2 font-bold text-charcoal">
            <Store className="w-4 h-4 text-nyamleng-600" />
            <span>Kedai Nyamleng Malang</span>
          </div>
          <p className="text-[10px]">Kota Malang, Jawa Timur • Open 09:00 - 22:00 WIB</p>
        </div>
      </div>
    </div>
  );
};
