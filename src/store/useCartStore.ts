import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  CartItem, 
  DeliveryCourier, 
  MenuItem, 
  OFFICIAL_STORE_EMAIL, 
  OFFICIAL_STORE_WA, 
  OrderPayload, 
  OrderType, 
  PaymentMethod, 
  SelectedAddOn, 
  SelectedVariant,
  StoreSettings,
  Voucher 
} from '@/types/pos';
import { supabase } from '@/lib/supabaseClient';
import { createSupabaseTransaction } from '@/services/supabaseOrderService';
import { 
  fetchSupabaseMenuItems, 
  fetchSupabaseVouchers,
  fetchSupabaseStoreSettings,
  updateSupabaseStoreSettings,
  DEFAULT_STORE_SETTINGS
} from '@/services/supabaseMenuService';


export const INITIAL_VOUCHERS: Voucher[] = [
  {
    code: 'NYAMLENGHERO',
    title: 'Diskon Spesial Menu Rp 10.000',
    description: 'Potongan Rp 10.000 untuk seluruh menu makanan & minuman (Min. Belanja Rp 40.000).',
    discountType: 'FIXED',
    discountValue: 10000,
    minSubtotal: 40000,
    applicableOrderType: 'ALL',
    validUntil: '31 Agt 2026',
    isActive: true,
  },
  {
    code: 'MALANGHEMAT',
    title: 'Diskon Hemat 15% All Menu',
    description: 'Potongan 15% untuk seluruh menu makanan & minuman (Maks. Diskon Rp 15.000).',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    maxDiscount: 15000,
    minSubtotal: 30000,
    applicableOrderType: 'ALL',
    validUntil: '15 Sep 2026',
    isActive: true,
  },
  {
    code: 'NYAMLENG5K',
    title: 'Potongan Harga Menu Rp 5.000',
    description: 'Potongan Rp 5.000 langsung untuk transaksi pesanan makanan (Min. Belanja Rp 25.000).',
    discountType: 'FIXED',
    discountValue: 5000,
    minSubtotal: 25000,
    applicableOrderType: 'ALL',
    validUntil: '30 Agt 2026',
    isActive: true,
  },
];

interface CartState {
  menuItems: MenuItem[];
  isLoadingMenu: boolean;
  cartItems: CartItem[];
  orderType: OrderType;
  deliveryCourier: DeliveryCourier;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  addressNotes: string;
  orderNotes: string;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isOrderStatusOpen: boolean;
  isVoucherModalOpen: boolean;
  activeOrder: OrderPayload | null;
  pendingPaymentOrder: OrderPayload | null;
  customerOrderIds: string[];
  searchQuery: string;
  selectedCategory: string;

  // Store Settings (Operating Hours & Open/Close Control)
  storeSettings: StoreSettings;
  fetchStoreSettings: () => Promise<void>;
  updateStoreSettings: (settings: Partial<StoreSettings>) => Promise<boolean>;
  isStoreOpen: () => boolean;

  // Voucher State
  appliedVoucher: Voucher | null;
  availableVouchers: Voucher[];

  // Menu Operations
  fetchMenuItems: () => Promise<void>;

  // Setters
  setOrderType: (type: OrderType) => void;
  setDeliveryCourier: (courier: DeliveryCourier) => void;
  setCustomerInfo: (name: string, email: string, phone?: string) => void;
  setDeliveryAddress: (address: string, notes?: string) => void;
  setOrderNotes: (notes: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (catId: string) => void;
  toggleCart: (isOpen?: boolean) => void;
  toggleCheckout: (isOpen?: boolean) => void;
  toggleOrderStatus: (isOpen?: boolean, orderPayload?: OrderPayload | null) => void;
  setActiveOrder: (orderPayload: OrderPayload | null) => void;
  setPendingPaymentOrder: (orderPayload: OrderPayload | null) => void;
  clearPendingPayment: () => void;
  saveCustomerOrderId: (orderId: string) => void;
  toggleVoucherModal: (isOpen?: boolean) => void;
  syncActiveOrderFromSupabase: (orderId: string) => Promise<OrderPayload | null>;

  // Cart Operations
  addToCart: (
    menuItem: MenuItem,
    selectedVariants?: SelectedVariant[],
    selectedAddOns?: SelectedAddOn[],
    itemNotes?: string,
    quantity?: number
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  updateItemNotes: (cartItemId: string, notes: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;

  // Voucher Operations
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;

  // Calculations
  getSubtotal: () => number;
  getTaxAmount: () => number;
  getServiceFee: () => number;
  getDiscountAmount: () => number;
  getTotalAmount: () => number;
  getItemCount: () => number;

  // Order Submission & Auto-Email Dispatch
  submitOrder: (paymentMethod?: PaymentMethod, explicitOrder?: OrderPayload) => Promise<OrderPayload>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      menuItems: [],
      isLoadingMenu: false,
      cartItems: [],
      orderType: 'TAKEAWAY',
      deliveryCourier: 'GRAB_SEND',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      deliveryAddress: '',
      addressNotes: '',
      orderNotes: '',
      isCartOpen: false,
      isCheckoutOpen: false,
      isOrderStatusOpen: false,
      isVoucherModalOpen: false,
      activeOrder: null,
      pendingPaymentOrder: null,
      customerOrderIds: [],

      searchQuery: '',
      selectedCategory: 'all',

      appliedVoucher: null,
      availableVouchers: INITIAL_VOUCHERS,
      storeSettings: DEFAULT_STORE_SETTINGS,

      fetchStoreSettings: async () => {
        try {
          const settings = await fetchSupabaseStoreSettings();
          set({ storeSettings: settings });
        } catch (e) {
          console.error('[fetchStoreSettings error]:', e);
        }
      },

      updateStoreSettings: async (newSettings) => {
        try {
          const current = get().storeSettings;
          const merged = { ...current, ...newSettings };
          set({ storeSettings: merged });
          const success = await updateSupabaseStoreSettings(merged);
          return success;
        } catch (e) {
          console.error('[updateStoreSettings error]:', e);
          return false;
        }
      },

      isStoreOpen: () => {
        const settings = get().storeSettings;
        if (!settings) return true;
        // If manual override closed
        if (!settings.isOpen) return false;
        // If not using auto schedule, follow manual isOpen
        if (!settings.isAutoSchedule) return settings.isOpen;

        // Auto schedule checking against WIB (UTC+7)
        try {
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = { 
            timeZone: 'Asia/Jakarta', 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          };
          const wibTimeString = new Intl.DateTimeFormat('id-ID', options).format(now);
          const [currentH, currentM] = wibTimeString.split(':').map(Number);
          const currentMins = (currentH || 0) * 60 + (currentM || 0);

          const [openH, openM] = (settings.openTime || '08:00').split(':').map(Number);
          const openMins = (openH || 0) * 60 + (openM || 0);

          const [closeH, closeM] = (settings.closeTime || '22:00').split(':').map(Number);
          const closeMins = (closeH || 0) * 60 + (closeM || 0);

          if (openMins <= closeMins) {
            return currentMins >= openMins && currentMins < closeMins;
          } else {
            // Overnight window (e.g. 18:00 - 02:00)
            return currentMins >= openMins || currentMins < closeMins;
          }
        } catch {
          return settings.isOpen;
        }
      },

      fetchMenuItems: async () => {
        set({ isLoadingMenu: true });
        try {
          const [items, vouchers, settings] = await Promise.all([
            fetchSupabaseMenuItems(),
            fetchSupabaseVouchers(),
            fetchSupabaseStoreSettings(),
          ]);
          set({
            menuItems: items,
            availableVouchers: vouchers && vouchers.length > 0 ? vouchers : get().availableVouchers,
            storeSettings: settings || get().storeSettings,
            isLoadingMenu: false,
          });
        } catch (e) {
          console.error('[fetchMenuItems error]:', e);
          set({ isLoadingMenu: false });
        }
      },

      setOrderType: (type) => set({ orderType: type }),
      setDeliveryCourier: (courier) => set({ deliveryCourier: courier }),
      setCustomerInfo: (name, email, phone = '') => 
        set({ customerName: name, customerEmail: email, customerPhone: phone }),
      setDeliveryAddress: (address, notes = '') =>
        set({ deliveryAddress: address, addressNotes: notes }),
      setOrderNotes: (notes) => set({ orderNotes: notes }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (catId) => set({ selectedCategory: catId }),
      toggleCart: (isOpen) => set((state) => ({ isCartOpen: isOpen ?? !state.isCartOpen })),
      toggleCheckout: (isOpen) => set((state) => ({ isCheckoutOpen: isOpen ?? !state.isCheckoutOpen })),
      toggleOrderStatus: (isOpen, orderPayload) => set((state) => ({ 
        isOrderStatusOpen: isOpen ?? !state.isOrderStatusOpen,
        ...(orderPayload !== undefined ? { activeOrder: orderPayload } : {})
      })),
      setActiveOrder: (orderPayload) => set({ activeOrder: orderPayload }),
      setPendingPaymentOrder: (orderPayload) => set({ pendingPaymentOrder: orderPayload }),
      clearPendingPayment: () => set({ pendingPaymentOrder: null }),
      saveCustomerOrderId: (orderId) => set((state) => ({
        customerOrderIds: Array.from(new Set([...state.customerOrderIds, orderId]))
      })),
      syncActiveOrderFromSupabase: async (orderId: string) => {
        try {
          const { data, error } = await supabase
            .from('Transaction')
            .select('*, items:TransactionItem(*)')
            .eq('id', orderId)
            .single();

          if (error || !data) return null;

          const syncedOrder: OrderPayload = {
            orderId: data.id || data.orderNumber,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            orderType: data.orderType,
            deliveryCourier: data.deliveryCourier,
            orderNotes: data.orderNotes,
            items: (data.items || []).map((item: any) => ({
              cartItemId: item.id,
              menuItem: {
                id: item.menuItemId || 'menu-item',
                posSku: item.id?.slice(-6).toUpperCase() || 'SKU-001',
                name: item.nameSnapshot,
                description: '',
                price: Number(item.priceSnapshot),
                categoryId: 'makanan',
                image: '',
                isAvailable: true,
              },
              selectedVariants: [],
              selectedAddOns: [],
              itemNotes: '',
              quantity: item.qty || 1,
              unitPrice: Number(item.priceSnapshot),
              itemSubtotal: Number(item.priceSnapshot) * (item.qty || 1),
            })),
            subtotal: Number(data.subtotal || data.total),
            taxAmount: Number(data.tax || 0),
            serviceFee: 0,
            discountAmount: Number(data.discountAmount || 0),
            totalAmount: Number(data.total),
            paymentMethod: 'QRIS',
            paymentStatus: data.paymentStatus || 'PAID',
            orderStatus: data.orderStatus || 'PENDING',
            createdAt: data.createdAt,
            posSyncStatus: 'SYNCED',
          };

          set({ activeOrder: syncedOrder });
          return syncedOrder;
        } catch (e) {
          console.warn('[Sync Active Order Error]:', e);
          return null;
        }
      },

      toggleVoucherModal: (isOpen) => {
        const nextState = isOpen ?? !get().isVoucherModalOpen;
        set({ isVoucherModalOpen: nextState });
        if (nextState) {
          fetchSupabaseVouchers().then((vouchers) => {
            if (vouchers && Array.isArray(vouchers)) {
              set({ availableVouchers: vouchers });
            }
          }).catch((err) => console.warn('[Vouchers Fetch Error]:', err));
        }
      },

      addToCart: (menuItem, selectedVariants = [], selectedAddOns = [], itemNotes = '', quantity = 1) => {
        const variantExtra = selectedVariants.reduce((acc, v) => acc + v.priceModifier, 0);
        const addOnExtra = selectedAddOns.reduce((acc, a) => acc + a.price, 0);
        const unitPrice = menuItem.price + variantExtra + addOnExtra;

        const cartItemId = `${menuItem.id}-${selectedVariants.map(v => v.optionId).join('_')}-${selectedAddOns.map(a => a.optionId).join('_')}-${itemNotes.trim()}`;

        set((state) => {
          const existingIndex = state.cartItems.findIndex((ci) => ci.cartItemId === cartItemId);
          if (existingIndex > -1) {
            const updated = [...state.cartItems];
            const currentItem = updated[existingIndex];
            const newQty = currentItem.quantity + quantity;
            updated[existingIndex] = {
              ...currentItem,
              quantity: newQty,
              itemSubtotal: newQty * currentItem.unitPrice,
            };
            return { cartItems: updated };
          }

          const newCartItem: CartItem = {
            cartItemId,
            menuItem,
            selectedVariants,
            selectedAddOns,
            itemNotes,
            quantity,
            unitPrice,
            itemSubtotal: unitPrice * quantity,
          };

          return { cartItems: [...state.cartItems, newCartItem] };
        });
      },

      updateQuantity: (cartItemId, delta) => {
        set((state) => {
          const updated = state.cartItems
            .map((item) => {
              if (item.cartItemId === cartItemId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                return {
                  ...item,
                  quantity: newQty,
                  itemSubtotal: newQty * item.unitPrice,
                };
              }
              return item;
            })
            .filter((item): item is CartItem => item !== null);
          return { cartItems: updated };
        });
      },

      updateItemNotes: (cartItemId, notes) => {
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.cartItemId === cartItemId ? { ...item, itemNotes: notes } : item
          ),
        }));
      },

      removeFromCart: (cartItemId) => {
        set((state) => ({
          cartItems: state.cartItems.filter((i) => i.cartItemId !== cartItemId),
        }));
      },

      clearCart: () => set({ cartItems: [], appliedVoucher: null, orderNotes: '' }),

      applyVoucher: (code) => {
        const state = get();
        const cleanCode = code.trim().toUpperCase();
        const voucher = state.availableVouchers.find((v) => v.code === cleanCode && v.isActive);

        if (!voucher) {
          return { success: false, message: `Voucher promo "${code}" tidak ditemukan atau sudah tidak berlaku.` };
        }

        const subtotal = state.getSubtotal();
        if (subtotal < voucher.minSubtotal) {
          return {
            success: false,
            message: `Minimal belanja untuk voucher ini adalah Rp ${voucher.minSubtotal.toLocaleString('id-ID')}`,
          };
        }

        set({ appliedVoucher: voucher });
        return { success: true, message: `Voucher ${voucher.title} berhasil digunakan!` };
      },

      removeVoucher: () => set({ appliedVoucher: null }),

      getSubtotal: () => {
        return get().cartItems.reduce((acc, item) => acc + item.itemSubtotal, 0);
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const taxable = Math.max(subtotal - discount, 0);
        return Math.round(taxable * 0.1);
      },

      getServiceFee: () => 0,

      getDiscountAmount: () => {
        const { appliedVoucher } = get();
        if (!appliedVoucher) return 0;
        const subtotal = get().getSubtotal();

        if (appliedVoucher.discountType === 'FIXED') {
          return Math.min(appliedVoucher.discountValue, subtotal);
        }

        if (appliedVoucher.discountType === 'PERCENTAGE') {
          const discount = Math.round((subtotal * appliedVoucher.discountValue) / 100);
          if (appliedVoucher.maxDiscount) {
            return Math.min(discount, appliedVoucher.maxDiscount);
          }
          return discount;
        }

        return 0;
      },

      getTotalAmount: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const tax = get().getTaxAmount();
        const service = get().getServiceFee();
        return Math.max(subtotal - discount + tax + service, 0);
      },

      getItemCount: () => {
        return get().cartItems.reduce((acc, item) => acc + item.quantity, 0);
      },

      submitOrder: async (paymentMethod = 'QRIS', explicitOrder?: OrderPayload) => {
        const state = get();
        let newOrder = explicitOrder;

        if (!newOrder) {
          const orderId = `KDN-${Date.now().toString().slice(-6)}`;
          let fullNotes = state.orderNotes || '';
          if (state.orderType === 'DELIVERY' && state.deliveryAddress) {
            fullNotes = `Alamat: ${state.deliveryAddress}${state.addressNotes ? ` (Patokan: ${state.addressNotes})` : ''} | ${fullNotes}`;
          }

          newOrder = {
            orderId,
            customerName: state.customerName || 'Pelanggan Kedai',
            customerEmail: state.customerEmail || OFFICIAL_STORE_EMAIL,
            customerPhone: state.customerPhone || OFFICIAL_STORE_WA,
            orderType: state.orderType,
            deliveryCourier: state.orderType === 'DELIVERY' ? state.deliveryCourier : undefined,
            orderNotes: fullNotes,
            items: state.cartItems,
            subtotal: state.getSubtotal(),
            taxAmount: state.getTaxAmount(),
            serviceFee: 0,
            discountAmount: state.getDiscountAmount(),
            appliedVoucherCode: state.appliedVoucher?.code,
            totalAmount: state.getTotalAmount(),
            paymentMethod: 'QRIS',
            paymentStatus: 'PAID',
            orderStatus: 'PENDING',
            createdAt: new Date().toISOString(),
            posSyncStatus: 'SYNCED',
          };
        }

        set((s) => ({
          activeOrder: newOrder,
          pendingPaymentOrder: null,
          customerOrderIds: Array.from(new Set([...s.customerOrderIds, newOrder!.orderId])),
          cartItems: [],
          isCheckoutOpen: false,
          isOrderStatusOpen: true,
        }));

        // 1. Sync Transaction to Master Supabase POS Database
        createSupabaseTransaction(newOrder).catch((err) => {
          console.error('[Supabase Master POS Sync Error]:', err);
        });

        // 2. Instant Email & WhatsApp Dispatch Call
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          const emailRes = await fetch(`${baseUrl}/api/email/send-receipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder),
          });
          const emailData = await emailRes.json();
          console.log('Instant Email Dispatch Success:', emailData);
        } catch (e) {
          console.error('Instant Dispatch Error:', e);
        }

        return newOrder;
      },
    }),
    {
      name: 'kedai-nyamleng-cart-storage',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : (null as any))),
      partialize: (state) => ({
        cartItems: state.cartItems,
        orderType: state.orderType,
        deliveryCourier: state.deliveryCourier,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        customerPhone: state.customerPhone,
        deliveryAddress: state.deliveryAddress,
        addressNotes: state.addressNotes,
        orderNotes: state.orderNotes,
        appliedVoucher: state.appliedVoucher,
        activeOrder: state.activeOrder,
        pendingPaymentOrder: state.pendingPaymentOrder,
        customerOrderIds: state.customerOrderIds,
      }),
    }
  )
);
