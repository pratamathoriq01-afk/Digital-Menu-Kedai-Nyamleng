import { supabase } from '@/lib/supabaseClient';
import { OrderPayload, Voucher } from '@/types/pos';
import { INITIAL_VOUCHERS } from '@/store/useCartStore';

export const createSupabaseTransaction = async (order: OrderPayload) => {
  try {
    const hppTotal = order.items.reduce((acc, item) => {
      const itemHpp = (item.menuItem as any).hpp || Math.round(item.unitPrice * 0.5);
      return acc + itemHpp * item.quantity;
    }, 0);

    const netProfit = Math.max(order.totalAmount - hppTotal, 0);

    // 1. Insert into "Transaction" table in Supabase DB (POS Master Data)
    const { data: txData, error: txError } = await supabase
      .from('Transaction')
      .insert({
        id: order.orderId,
        orderNumber: order.orderId,
        customerName: order.customerName,
        orderType: order.orderType,
        tableNumber: order.orderType === 'TAKEAWAY' ? 'TAKEAWAY-ONLINE' : 'DELIVERY-ONLINE',
        subtotal: order.subtotal,
        discountType: order.appliedVoucherCode ? 'VOUCHER' : null,
        discountValue: order.discountAmount,
        discountAmount: order.discountAmount,
        tax: order.taxAmount,
        total: order.totalAmount,
        hppTotal,
        netProfit,
        cashReceived: order.totalAmount,
        change: 0,
        orderStatus: 'PROCESSED',
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryCourier: order.deliveryCourier || null,
        orderNotes: order.orderNotes || null,
        paymentStatus: 'PAID',
        paymentMethod: 'QRIS',
        createdAt: new Date().toISOString(),
      })
      .select();

    if (txError) {
      console.error('[Supabase Transaction Error]:', txError.message);
    } else {
      console.log('[Supabase Transaction Created]:', txData);
    }

    // 2. Insert into "TransactionItem" table for each item ordered
    const itemRecords = order.items.map((item, idx) => ({
      id: `${order.orderId}-item-${idx + 1}`,
      transactionId: order.orderId,
      menuItemId: item.menuItem.id,
      nameSnapshot: item.menuItem.name,
      priceSnapshot: item.unitPrice,
      hppSnapshot: (item.menuItem as any).hpp || Math.round(item.unitPrice * 0.5),
      qty: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('TransactionItem')
      .insert(itemRecords);

    if (itemsError) {
      console.error('[Supabase TransactionItem Error]:', itemsError.message);
    }

    return { success: !txError, txData };
  } catch (err) {
    console.error('[Supabase Transaction Exception]:', err);
    return { success: false, error: err };
  }
};

export const fetchSupabaseVouchers = async (): Promise<Voucher[]> => {
  try {
    const { data, error } = await supabase
      .from('Voucher')
      .select('*')
      .eq('isActive', true);

    if (error || !data || data.length === 0) {
      return INITIAL_VOUCHERS;
    }

    return data.map((v: any) => ({
      code: v.code,
      title: v.title,
      description: v.description,
      discountType: v.discountType,
      discountValue: Number(v.discountValue),
      maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : undefined,
      minSubtotal: Number(v.minSubtotal),
      applicableOrderType: 'ALL',
      validUntil: v.validUntil,
      isActive: v.isActive,
    }));
  } catch (err) {
    console.error('[Supabase Voucher Exception]:', err);
    return INITIAL_VOUCHERS;
  }
};
