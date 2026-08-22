'use client';

import { fetchSupabaseVouchers, fetchSupabaseStoreSettings } from '@/services/supabaseMenuService';
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
import { StoreClosedBanner } from '@/components/StoreClosedBanner';
import { MenuItemCard } from '@/components/MenuItemCard';
import { ItemCustomizeModal } from '@/components/ItemCustomizeModal';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrderStatusModal } from '@/components/OrderStatusModal';
import { GoogleLoginModal } from '@/components/GoogleLoginModal';
import { OrderHistoryDrawer } from '@/components/OrderHistoryDrawer';
import { FloatingNotificationBanner } from '@/components/FloatingNotificationBanner';
import { FloatingOrderStatus } from '@/components/FloatingOrderStatus';
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

    // 1. Smart 10s fallback menu & voucher sync poller
    const syncPoller = setInterval(() => {
      fetchMenuItems().catch(() => {});
    }, 10000);

    // 2. Supabase Realtime WebSocket Subscription for instant Kasir updates (0ms delay)
    const channel = supabase
      .channel('realtime_menu_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'MenuItem' }, () => {
        fetchMenuItems().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'AddOn' }, () => {
        // Re-fetch menu items so add-ons are re-attached dynamically
        fetchMenuItems().catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'StoreSettings' }, () => {
        fetchSupabaseStoreSettings().then((settings) => {
          if (settings) {
            useCartStore.setState({ storeSettings: settings });
          }
        }).catch(() => {});
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Voucher' }, () => {
        fetchSupabaseVouchers().then((vouchers) => {
          if (vouchers && Array.isArray(vouchers)) {
            useCartStore.setState({ availableVouchers: vouchers });
          }
        }).catch(() => {});
      })
      .subscribe();


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

  // Filter items based on active category & search query
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all'
        ? true
        : selectedCategory === 'promo'
        ? (item.tags && (item.tags.includes('Hemat') || (item.tags as string[]).includes('Promo') || (item.tags as string[]).includes('Paket')))
        : selectedCategory === 'camilan'
        ? item.categoryId === 'camilan' || item.categoryId === 'snack'
        : item.categoryId === selectedCategory;

    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.posSku.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchesCategory && matchesSearch;
  });

  // Dynamic Category Section Grouping (when viewing "Semua Menu" without active search query)
  const groupedSections = React.useMemo(() => {
    if (selectedCategory !== 'all' || searchQuery) {
      return null;
    }

    const CATEGORY_META: Record<string, { title: string; order: number }> = {
      'paket-hemat': { title: '📦 Paket Hemat & Promo', order: 1 },
      'ayam-nyamleng': { title: '🍗 Menu Ayam Nyamleng', order: 2 },
      'ikan-nyamleng': { title: '🐟 Menu Ikan & Bebek Nyamleng', order: 3 },
      'makanan': { title: '🍽️ Tahu Tempe Nyamleng', order: 4 },
      'alacarte': { title: '🍱 Ala Carte & Side Dish', order: 5 },
      'snack': { title: '🍟 Cemilan & Snack', order: 6 },
      'dessert': { title: '🍰 Dessert & Pencuci Mulut', order: 7 },
      'minuman': { title: '🥤 Minuman Segar', order: 99 },
    };

    const map = new Map<string, MenuItem[]>();

    for (const item of filteredMenuItems) {
      const slug = item.categoryId || 'makanan';
      if (!map.has(slug)) map.set(slug, []);
      map.get(slug)!.push(item);
    }

    const sections = Array.from(map.entries()).map(([slug, items]) => {
      const meta = CATEGORY_META[slug] || {
        title: `🍽️ ${slug.replace(/-/g, ' ').toUpperCase()}`,
        order: 99,
      };
      return {
        slug,
        title: meta.title,
        order: meta.order,
        items,
      };
    });

    sections.sort((a, b) => a.order - b.order);
    return sections;
  }, [filteredMenuItems, selectedCategory, searchQuery]);

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
        
        {/* Realtime Store Closed Alert Banner */}
        <StoreClosedBanner />

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
              <div className="bg-white rounded-3xl p-10 text-center border border-parchment-border space-y-3 shadow-xs">
                <Utensils className="w-12 h-12 text-nyamleng-300 mx-auto animate-bounce" />
                <h3 className="font-bold text-base text-charcoal">
                  {searchQuery ? 'Menu Tidak Ditemukan' : 'Menu Sedang Disiapkan Kasir'}
                </h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  {searchQuery
                    ? `Maaf, tidak ada menu yang cocok dengan kata kunci "${searchQuery}". Silakan coba kata kunci lain.`
                    : 'Belum ada menu aktif di database. Daftar menu tersinkronisasi realtime dengan Kasir App dan akan otomatis muncul begitu ditambahkan!'}
                </p>
              </div>
            ) : groupedSections ? (
              /* Categorized Sections View (When "Semua Menu" is selected) */
              <div className="space-y-6">
                {groupedSections.map((section) => (
                  <div key={section.slug} id={`category-section-${section.slug}`} className="space-y-3 pt-1">
                    {/* Category Sub-Header Banner */}
                    <div className="bg-gradient-to-r from-nyamleng-50 to-amber-50 p-3 rounded-2xl border border-nyamleng-200/80 flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base text-charcoal">{section.title}</span>
                      </div>
                      <span className="text-[11px] font-bold text-nyamleng-700 bg-white px-2.5 py-0.5 rounded-full border border-nyamleng-200 shadow-2xs">
                        {section.items.length} Menu
                      </span>
                    </div>

                    {/* Menu Grid per Category */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 sm:gap-3.5">
                      {section.items.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onOpenCustomize={handleOpenCustomize}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Single Category View / Search View */
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 sm:gap-3.5">
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
                  <p className="text-[11px] text-gray-400 max-w-[200px] mx-auto">
                    Pilih menu makanan atau minuman kesukaanmu.
                  </p>
                </div>
              ) : (
                <>
                  <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1">
                    {cartItems.map((item) => (
                      <div 
                        key={item.cartItemId}
                        className="p-3 bg-parchment-soft rounded-2xl border border-parchment-border space-y-2"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-xs text-charcoal truncate">
                              {item.menuItem.name}
                            </h4>
                            <span className="text-[10px] text-gray-500 block">
                              {formatRupiah(item.unitPrice)} / porsi
                            </span>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.cartItemId)}
                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                            aria-label="Hapus Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Variants & Addons Chips */}
                        {(item.selectedVariants.length > 0 || item.selectedAddOns.length > 0) && (
                          <div className="flex flex-wrap gap-1">
                            {item.selectedVariants.map((v) => (
                              <span key={v.optionId} className="text-[9px] font-semibold bg-white px-2 py-0.5 rounded-md text-gray-600 border border-parchment-border">
                                {v.optionName}
                              </span>
                            ))}
                            {item.selectedAddOns.map((a) => (
                              <span key={a.optionId} className="text-[9px] font-semibold bg-white px-2 py-0.5 rounded-md text-nyamleng-600 border border-parchment-border">
                                +{a.optionName}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Quantity Counter */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 bg-white border border-parchment-border rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.cartItemId, -1)}
                              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-charcoal rounded hover:bg-gray-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold px-1">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.cartItemId, 1)}
                              className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-charcoal rounded hover:bg-gray-100"
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
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-slide-up pb-[env(safe-area-inset-bottom)]">
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

      {/* Top Push Notification Banner (WhatsApp / Instagram Style) */}
      <FloatingNotificationBanner />

      {/* Floating Live Order Status Bar */}
      <FloatingOrderStatus />

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
