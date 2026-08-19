'use client';

import { fetchSupabaseVouchers } from '@/services/supabaseMenuService';
import React, { useState, useEffect } from 'react';

import { 
  ShoppingBag, 
  ShoppingBasket, 
  ArrowRight, 
  Trash2, 
  Plus, 
  Minus, 
  Utensils, 
  Flame
} from 'lucide-react';
import { Header } from '@/components/Header';
import { CategoryNav } from '@/components/CategoryNav';
import { MenuItemCard } from '@/components/MenuItemCard';
import { ItemCustomizeModal } from '@/components/ItemCustomizeModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderStatusModal } from '@/components/OrderStatusModal';
import { GoogleLoginModal } from '@/components/GoogleLoginModal';
import { OrderHistoryDrawer } from '@/components/OrderHistoryDrawer';
import { useCartStore } from '@/store/useCartStore';
import { CustomerUser, getStoredCustomerUser, setStoredCustomerUser, syncCustomerToSupabase, handleSupabaseLogout } from '@/services/authService';
import { MenuItem, OFFICIAL_STORE_WA } from '@/types/pos';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const {
    menuItems,
    fetchMenuItems,
    cartItems,
    selectedCategory,
    searchQuery,
    getItemCount,
    getSubtotal,
    getTaxAmount,
    getTotalAmount,
    toggleCart,
    toggleCheckout,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCartStore();

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState<boolean>(false);

  // Customer Authentication & Drawer State
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(null);
  const [isGoogleLoginOpen, setIsGoogleLoginOpen] = useState<boolean>(false);
  const [isSidebarDrawerOpen, setIsSidebarDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchMenuItems();

    // Auto 3s realtime voucher sync poller
    const voucherPoller = setInterval(() => {
      fetchSupabaseVouchers().then((vouchers) => {
        if (vouchers && Array.isArray(vouchers)) {
          useCartStore.setState({ availableVouchers: vouchers });
        }
      }).catch(() => {});
    }, 3000);

    // 1. Periksa apakah ada payload user dari Google OAuth Redirect URL (?login_success=true&user=...)
    let activeUser: CustomerUser | null = null;

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const loginSuccess = searchParams.get('login_success');
      const userParam = searchParams.get('user');

      if (loginSuccess === 'true' && userParam) {
        try {
          const jsonStr = Buffer.from(userParam, 'base64url').toString('utf8');
          const userObj = JSON.parse(jsonStr);
          if (userObj && userObj.email) {
            setStoredCustomerUser(userObj);
            activeUser = userObj;
            window.history.replaceState({}, '', window.location.pathname);
          }
        } catch (err) {
          console.error('[Hydrate User Param Error]:', err);
        }
      }
    }

    // 2. Jika tidak ada di URL, periksa localStorage
    if (!activeUser) {
      activeUser = getStoredCustomerUser();
    }

    // 3. Jika belum ada di localStorage, periksa Cookie browser kedai_nyamleng_user
    if (!activeUser && typeof document !== 'undefined') {
      const match = document.cookie.match(/kedai_nyamleng_user=([^;]+)/);
      if (match) {
        try {
          const parsedCookie = JSON.parse(decodeURIComponent(match[1]));
          if (parsedCookie && parsedCookie.email) {
            activeUser = parsedCookie;
            setStoredCustomerUser(parsedCookie);
          }
        } catch (cookieErr) {
          console.warn('[Cookie User Parse Error]:', cookieErr);
        }
      }
    }

    // 4. Update State UI berdasarkan ketersediaan user
    if (activeUser) {
      setCurrentUser(activeUser);
      setIsGoogleLoginOpen(false);
    } else {
      setIsGoogleLoginOpen(true);
    }

    // Realtime Supabase Auth SSO State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Supabase Auth Event Listener]:', event, session);
      if (session?.user) {
        const u = session.user;
        const ssoUser: CustomerUser = {
          id: u.id,
          googleId: u.user_metadata?.sub || u.id,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] || 'Pelanggan Kedai',
          email: u.email || '',
          phone: u.user_metadata?.phone || OFFICIAL_STORE_WA,
          avatarUrl: u.user_metadata?.avatar_url || u.user_metadata?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || 'user')}`,
          provider: 'GOOGLE',
        };

        const synced = await syncCustomerToSupabase(ssoUser);
        setCurrentUser(synced);
        setIsGoogleLoginOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsGoogleLoginOpen(true);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchMenuItems]);

  const handleLoginSuccess = (user: CustomerUser) => {
    setCurrentUser(user);
    setIsGoogleLoginOpen(false);
  };

  const handleLogout = async () => {
    await handleSupabaseLogout();
    setStoredCustomerUser(null);
    setCurrentUser(null);
    setIsSidebarDrawerOpen(false);
    setIsGoogleLoginOpen(true);
  };

  const itemCount = getItemCount();
  const subtotal = getSubtotal();
  const tax = getTaxAmount();
  const totalAmount = getTotalAmount();

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter menu items by selected category and search query
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory && selectedCategory !== 'all'
        ? item.categoryId === selectedCategory
        : true;
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.posSku.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  const handleOpenCustomize = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setIsCustomizeOpen(true);
  };

  return (
    <main className="min-h-screen bg-parchment text-charcoal font-sans flex flex-col pb-24 md:pb-12">
      {/* Sticky Top Header with Burger Bar & Customer Badge */}
      <Header 
        onOpenSidebarDrawer={() => setIsSidebarDrawerOpen(true)}
        currentUser={currentUser}
        onLogoutSuccess={handleLogout}
        onOpenLoginModal={() => setIsGoogleLoginOpen(true)}
      />

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-4 sm:py-6 space-y-6">
        
        {/* Category Navigation Bar */}
        <CategoryNav />

        {/* Catalog Layout: Menu Grid + Desktop Cart Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Menu Catalog Grid */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Section Title Bar */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-parchment-border shadow-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-nyamleng-500" />
                <h2 className="font-extrabold text-sm sm:text-base text-charcoal">
                  {searchQuery ? `Hasil Pencarian: "${searchQuery}"` : 'Daftar Menu Khas Kedai'}
                </h2>
              </div>

              <span className="text-xs text-gray-500 font-semibold bg-parchment-soft px-3 py-1 rounded-full border border-parchment-border">
                {filteredMenuItems.length} Menu Tersedia
              </span>
            </div>

            {/* Empty State */}
            {filteredMenuItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-parchment-border space-y-3">
                <Utensils className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="font-bold text-base text-charcoal">Menu Tidak Ditemukan</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Maaf, tidak ada menu yang cocok dengan kata kunci pencarian "{searchQuery}". Coba kata kunci lain.
                </p>
              </div>
            ) : (
              /* Menu Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onOpenCustomize={handleOpenCustomize}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop Persistent Cart Sidebar */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-parchment-border shadow-soft-card space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-parchment-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-nyamleng-500" />
                  <h3 className="font-extrabold text-base text-charcoal">Ringkasan Pesanan</h3>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Cart Item List */}
              {cartItems.length === 0 ? (
                <div className="py-8 text-center space-y-2 text-gray-400">
                  <Utensils className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-xs font-semibold text-charcoal">Keranjang Masih Kosong</p>
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Klik tombol "+ Tambah" pada menu makanan atau minuman untuk mengisi keranjang Anda.
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {cartItems.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="p-3 bg-parchment-soft rounded-2xl border border-parchment-border space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-charcoal truncate">{item.menuItem.name}</h4>
                            <span className="text-[11px] font-extrabold text-nyamleng-600">
                              {formatRupiah(item.unitPrice)}
                            </span>

                            {item.selectedVariants.length > 0 && (
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {item.selectedVariants.map((v) => v.optionName).join(', ')}
                              </p>
                            )}
                            {item.selectedAddOns.length > 0 && (
                              <p className="text-[10px] text-nyamleng-600 mt-0.5">
                                +{item.selectedAddOns.map((a) => a.optionName).join(', ')}
                              </p>
                            )}
                            {item.itemNotes && (
                              <p className="text-[10px] text-amber-700 italic mt-0.5">
                                Note: {item.itemNotes}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                            title="Hapus Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="pt-2 border-t border-parchment-border flex items-center justify-between">
                          <div className="flex items-center border border-parchment-border rounded-lg bg-white p-0.5">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, -1)}
                              className="w-5 h-5 flex items-center justify-center text-charcoal hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-5 text-center font-bold text-xs">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, 1)}
                              className="w-5 h-5 flex items-center justify-center text-charcoal hover:bg-gray-100 rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-extrabold text-xs text-charcoal">
                            {formatRupiah(item.itemSubtotal)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Pricing Breakdown */}
                  <div className="pt-3 border-t border-parchment-border space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-charcoal">{formatRupiah(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pajak Resto (PB1 10%)</span>
                      <span className="font-semibold text-charcoal">{formatRupiah(tax)}</span>
                    </div>
                    <div className="pt-2 border-t border-parchment-border flex justify-between items-center text-sm font-extrabold text-charcoal">
                      <span>Total Bayar</span>
                      <span className="text-base text-nyamleng-600">{formatRupiah(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Desktop Proceed to Checkout Button */}
                  <button
                    onClick={() => toggleCheckout(true)}
                    className="w-full py-3 px-4 bg-nyamleng-500 hover:bg-nyamleng-600 active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Bottom Cart Bar for Mobile */}
      {itemCount > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 animate-slide-up pb-[env(safe-area-inset-bottom)]">
          <div className="bg-charcoal text-white rounded-2xl p-3.5 shadow-2xl border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-nyamleng-500 text-white rounded-xl">
                <ShoppingBasket className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-charcoal text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-300 font-medium">Total Pembayaran</p>
                <p className="text-base font-extrabold text-white">{formatRupiah(totalAmount)}</p>
              </div>
            </div>

            <button
              onClick={() => toggleCart(true)}
              className="py-2.5 px-4 bg-nyamleng-500 hover:bg-nyamleng-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span>Cek Keranjang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Google Login Modal */}
      <GoogleLoginModal
        isOpen={isGoogleLoginOpen}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Burger Bar Sidebar Drawer: Order History & Profile */}
      <OrderHistoryDrawer
        isOpen={isSidebarDrawerOpen}
        onClose={() => setIsSidebarDrawerOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Item Customization Bottom Sheet / Modal */}
      <ItemCustomizeModal
        item={selectedMenuItem}
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
      />

      {/* Cart Drawer Modal */}
      <CartDrawer />

      {/* Checkout Modal */}
      <CheckoutModal />

      {/* Realtime Order Status Tracking Modal */}
      <OrderStatusModal />
    </main>
  );
}
