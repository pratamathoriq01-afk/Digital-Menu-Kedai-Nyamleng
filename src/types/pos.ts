export type OrderType = 'TAKEAWAY' | 'DELIVERY';

export type DeliveryCourier = 'GRAB_SEND' | 'GO_SEND' | 'INDRIVE' | 'SHOPEE_SPX';

export type PaymentMethod = 'QRIS';

export type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'KITCHEN_PROCESSING' 
  | 'READY' 
  | 'COMPLETED';

export type POSSyncStatus = 'SYNCED' | 'PENDING_SYNC' | 'FAILED';

export const OFFICIAL_STORE_WA = '085113661387';
export const OFFICIAL_STORE_EMAIL = 'kedainyamleng03@gmail.com';
export const STORE_LOCATION = 'Kota Malang, Jawa Timur';

export interface Voucher {
  code: string;
  title: string;
  description: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number; // e.g. 10000 or 15 (%)
  minSubtotal: number;
  maxDiscount?: number;
  applicableOrderType?: 'ALL' | 'DELIVERY' | 'TAKEAWAY';
  validUntil: string; // Formatted date string
  isActive: boolean;
}

export interface VariantOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface VariantGroup {
  id: string;
  name: string;
  required: boolean;
  options: VariantOption[];
}

export interface AddOnOption {
  id: string;
  name: string;
  price: number;
}

export interface AddOnGroup {
  id: string;
  name: string;
  maxSelect?: number;
  options: AddOnOption[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  sortOrder: number;
}

export interface MenuItem {
  id: string;
  posSku: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  tags?: ('Terlaris' | 'Pedas' | 'Rekomendasi' | 'Baru' | 'Hemat')[];
  isAvailable: boolean;
  preparationTimeMinutes?: number;
  variantGroups?: VariantGroup[];
  addOnGroups?: AddOnGroup[];
}

export interface SelectedVariant {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface SelectedAddOn {
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  selectedVariants: SelectedVariant[];
  selectedAddOns: SelectedAddOn[];
  itemNotes: string;
  quantity: number;
  unitPrice: number;
  itemSubtotal: number;
}

export interface OrderPayload {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderType: OrderType;
  deliveryCourier?: DeliveryCourier;
  items: CartItem[];
  subtotal: number;
  taxAmount: number; // PB1 10%
  serviceFee: number;
  discountAmount: number;
  appliedVoucherCode?: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'UNPAID' | 'PAID';
  orderStatus: OrderStatus;
  createdAt: string;
  posSyncStatus: POSSyncStatus;
}
