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
  Voucher 
} from '@/types/pos';
import { MOCK_MENU_ITEMS } from '@/data/mockMenu';
import { createSupabaseTransaction } from '@/services/supabaseOrderService';
import { fetchSupabaseMenuItems, fetchSupabaseVouchers } from '@/services/supabaseMenuService';

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
  orderNotes: string;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isOrderStatusOpen: boolean;
  isVoucherModalOpen: boolean;
  activeOrder: OrderPayload | null;
  searchQuery: string;
  selectedCategory: string;

  // Voucher State
  appliedVoucher: Voucher | null;
  availableVouchers: Voucher[];

  // Menu Operations
  fetchMenuItems: () => Promise<void>;

  // Setters
  setOrderType: (type: OrderType) => void;
  setDeliveryCourier: (courier: DeliveryCourier) => void;
  setCustomerInfo: (name: string, email: string, phone?: string) => void;
  setOrderNotes: (notes: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (catId: string) => void;
  toggleCart: (isOpen?: boolean) => void;
  toggleCheckout: (isOpen?: boolean) => void;
  toggleOrderStatus: (isOpen?: boolean, orderPayload?: OrderPayload | null) => void;
  setActiveOrder: (orderPayload: OrderPayload | null) => void;
  toggleVoucherModal: (isOpen?: boolean) => void;

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
  submitOrder: (paymentMethod?: PaymentMethod) => Promise<OrderPayload>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      menuItems: MOCK_MENU_ITEMS,
      isLoadingMenu: false,
      cartItems: [],
      orderType: 'TAKEAWAY',
      deliveryCourier: 'GRAB_SEND',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      orderNotes: '',
      isCartOpen: false,
      isCheckoutOpen: false,
      isOrderStatusOpen: false,
      isVoucherModalOpen: false,
      activeOrder: null,
      searchQuery: '',
      selectedCategory: 'all',

      appliedVoucher: null,
      availableVouchers: INITIAL_VOUCHERS,

      fetchMenuItems: async () => {
        set({ isLoadingMenu: true });
        try {
          const [items, vouchers] = await Promise.all([
            fetchSupabaseMenuItems(),
            fetchSupabaseVouchers(),
          ]);
          set({
            menuItems: items,
            availableVouchers: vouchers && vouchers.length > 0 ? vouchers : get().availableVouchers,
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
          const formatRupiah = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
          return { 
            success: false, 
            message: `Minimal belanja makanan untuk voucher ini adalah ${formatRupiah(voucher.minSubtotal)}. Tambahkan menu lagi!` 
          };
        }

        set({ appliedVoucher: voucher, isVoucherModalOpen: false });
        return { success: true, message: `Voucher "${voucher.code}" berhasil dipasang!` };
      },

      removeVoucher: () => set({ appliedVoucher: null }),

      getSubtotal: () => {
        return get().cartItems.reduce((acc, item) => acc + item.itemSubtotal, 0);
      },

      getTaxAmount: () => {
        const subtotal = get().getSubtotal();
        return Math.round(subtotal * 0.1); // PB1 10%
      },

      getServiceFee: () => 0,

      getDiscountAmount: () => {
        const state = get();
        if (!state.appliedVoucher) return 0;

        const subtotal = state.getSubtotal();
        const v = state.appliedVoucher;

        if (v.discountType === 'FIXED') {
          return Math.min(v.discountValue, subtotal);
        } else {
          const calculated = Math.round((subtotal * v.discountValue) / 100);
          return v.maxDiscount ? Math.min(calculated, v.maxDiscount) : calculated;
        }
      },

      getTotalAmount: () => {
        const subtotal = get().getSubtotal();
        const tax = get().getTaxAmount();
        const discount = get().getDiscountAmount();
        return Math.max(subtotal + tax - discount, 0);
      },

      getItemCount: () => {
        return get().cartItems.reduce((acc, item) => acc + item.quantity, 0);
      },

      submitOrder: async () => {
        const state = get();
        const orderId = `KDN-${Date.now().toString().slice(-6)}`;
        const newOrder: OrderPayload = {
          orderId,
          customerName: state.customerName || 'Pelanggan Kedai',
          customerEmail: state.customerEmail || OFFICIAL_STORE_EMAIL,
          customerPhone: state.customerPhone || OFFICIAL_STORE_WA,
          orderType: state.orderType,
          deliveryCourier: state.orderType === 'DELIVERY' ? state.deliveryCourier : undefined,
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

        set({
          activeOrder: newOrder,
          cartItems: [],
          isCheckoutOpen: false,
          isOrderStatusOpen: true,
        });

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
          console.log('Instant Email & WhatsApp Dispatch Success:', emailData);
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
        orderNotes: state.orderNotes,
        appliedVoucher: state.appliedVoucher,
        activeOrder: state.activeOrder,
      }),
    }
  )
);
