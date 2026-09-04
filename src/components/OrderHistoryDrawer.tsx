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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { StoreStatusModal } from './StoreStatusModal';

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
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStoreStatusModalOpen, setIsStoreStatusModalOpen] = useState(false);
  const { toggleOrderStatus, customerOrderIds } = useCartStore();

  useEffect(() => {
    if (!isOpen) return;

    const fetchCustomerHistory = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('Transaction')
          .select('*, items:TransactionItem(*)')
          .order('createdAt', { ascending: false });

        if (currentUser?.email) {
          query = query.or(`customerEmail.eq.${currentUser.email},customerUserId.eq.${currentUser.id}`);
        } else if (customerOrderIds && customerOrderIds.length > 0) {
          query = query.in('id', customerOrderIds);
        } else {
          setHistoryOrders([]);
          setIsLoading(false);
          return;
        }

        const { data, error } = await query;
        if (error) throw error;
        setHistoryOrders(data || []);
      } catch (err) {
        console.error('Fetch history error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerHistory();
  }, [isOpen, currentUser, customerOrderIds]);

  const handleOpenReceipt = (order: any) => {
    const cartItems = (order.items || []).map((item: any) => ({
      item: {
        id: item.menuItemId || item.id,
        posSku: item.menuItemId ? item.menuItemId.slice(-6).toUpperCase() : 'SKU-001',
        name: item.itemName || 'Menu Item',
        description: '',
        price: item.priceSnapshot || 0,
        categoryId: 'makanan',
        image: item.itemImage || '',
        category: 'food',
        imageUrl: '',
        isAvailable: true
      },
      selectedVariants: item.variants || [],
      selectedAddOns: item.addOns || [],
      itemNotes: item.notes || '',
      quantity: item.qty || item.quantity || 1,
      unitPrice: item.priceSnapshot || 0,
      itemSubtotal: (item.priceSnapshot || 0) * (item.qty || item.quantity || 1)
    }));

    const orderPayload: any = {
      orderId: order.orderNumber || order.id,
      customerName: order.customerName || currentUser?.name || 'Customer',
      customerEmail: order.customerEmail || currentUser?.email || '',
      customerPhone: order.customerPhone || currentUser?.phone || '',
      orderType: order.orderType || 'TAKEAWAY',
      deliveryCourier: order.deliveryCourier || 'GRAB_SEND',
      orderNotes: order.orderNotes || '',
      items: cartItems,
      subtotal: order.subtotal || order.total || 0,
      taxAmount: order.taxAmount || 0,
      serviceFee: order.serviceFee || 0,
      discountAmount: order.discountAmount || 0,
      totalAmount: order.total || order.totalAmount || 0,
      paymentMethod: order.paymentMethod || 'QRIS',
      paymentStatus: order.paymentStatus || 'PAID',
      orderStatus: order.orderStatus || 'PENDING',
      createdAt: order.createdAt || new Date().toISOString(),
      posSyncStatus: order.posSyncStatus || 'SYNCED'
    };

    onClose();
    toggleOrderStatus(true, orderPayload);
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const formatDate = (isoStr: string) => {
    if (!isoStr) return '';
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
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="right" showCloseButton={false} className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-0 border-none">
          {/* Header Drawer */}
        <div className="p-4 bg-nyamleng-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-black text-sm">
            <History className="w-5 h-5" />
            <span>Riwayat Pembelian Customer</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-nyamleng-700 rounded-full transition-all text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Profile Banner */}
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
            <div className="py-16 text-center text-gray-400 space-y-3">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto stroke-[1.5]" />
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
                  onClick={() => handleOpenReceipt(order)}
                  className="bg-white rounded-2xl p-4 border border-parchment-border shadow-xs hover:border-nyamleng-400 hover:shadow-md transition-all space-y-3 cursor-pointer active:scale-[0.99] group"
                >
                  {/* Order ID & Date */}
                  <div className="flex items-center justify-between pb-2 border-b border-parchment-border text-xs">
                    <div>
                      <span className="font-extrabold text-charcoal text-sm block group-hover:text-nyamleng-600 transition-colors">#{order.orderNumber || order.id}</span>
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
                            <span>{item.qty || item.quantity}x {item.nameSnapshot}</span>
                            <span className="font-mono text-[10px]">{formatRupiah((item.priceSnapshot || 0) * (item.qty || item.quantity || 1))}</span>
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

                  {/* Action Hint */}
                  <div className="pt-2 border-t border-dashed border-gray-100 flex items-center justify-between text-[11px] text-nyamleng-600 font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Lihat Rincian & Status Pesanan</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Store Info & Quick Store Controls */}
        <div className="p-4 bg-white border-t border-parchment-border text-[11px] text-gray-500 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-charcoal">
              <Store className="w-4 h-4 text-nyamleng-600" />
              <span>Kedai Nyamleng Malang</span>
            </div>

            <button
              type="button"
              onClick={() => setIsStoreStatusModalOpen(true)}
              className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              ⚙️ Atur Jam Toko
            </button>
          </div>
          <p className="text-[10px]">Kota Malang, Jawa Timur • Terintegrasi Realtime POS</p>
        </div>
      </SheetContent>
    </Sheet>

    {/* Store Status Control Modal */}
    <StoreStatusModal
      isOpen={isStoreStatusModalOpen}
      onClose={() => setIsStoreStatusModalOpen(false)}
    />
    </>
  );
};
