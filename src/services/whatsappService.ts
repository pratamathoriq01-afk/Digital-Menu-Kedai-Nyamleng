import { OFFICIAL_STORE_WA, OrderPayload } from '@/types/pos';

export const generateWhatsAppOrderMessage = (order: OrderPayload): string => {
  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const itemList = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.menuItem.name}* (${item.quantity}x) - ${formatRupiah(item.itemSubtotal)}` +
        (item.selectedVariants.length > 0 ? `\n   _Varian: ${item.selectedVariants.map((v) => v.optionName).join(', ')}_` : '') +
        (item.selectedAddOns.length > 0 ? `\n   _Topping: ${item.selectedAddOns.map((a) => a.optionName).join(', ')}_` : '') +
        (item.itemNotes ? `\n   _Catatan: ${item.itemNotes}_` : '')
    )
    .join('\n');

  return (
    `*KEDAI NYAMLENG MALANG - KONFIRMASI PESANAN*\n` +
    `-----------------------------------------\n` +
    `Halo *${order.customerName}*, terima kasih sudah memesan di Kedai Nyamleng!\n\n` +
    `*Detail Struk Pesanan #${order.orderId}:*\n` +
    `• Tipe Order: *${order.orderType === 'TAKEAWAY' ? 'Takeaway (Ambil di Toko)' : 'Delivery (Kurir Antar)'}*\n` +
    (order.deliveryCourier ? `• Kurir Delivery: *${order.deliveryCourier}*\n` : '') +
    `• Status Pembayaran: *LUNAS (QRIS Statis)*\n\n` +
    `*Rincian Menu:*\n${itemList}\n\n` +
    (order.discountAmount > 0 ? `• Diskon Promo (${order.appliedVoucherCode || 'Voucher'}): -${formatRupiah(order.discountAmount)}\n` : '') +
    `• Pajak Resto (PB1 10%): ${formatRupiah(order.taxAmount)}\n` +
    `*Total Pembayaran: ${formatRupiah(order.totalAmount)}*\n\n` +
    (order.orderNotes ? `*Catatan Khusus:* _${order.orderNotes}_\n\n` : '') +
    `Pesanan Anda saat ini sedang disiapkan oleh Koki Kedai Nyamleng! 👨‍🍳🔥\n` +
    `Silakan balas pesan ini jika ada pertanyaan mengenai pesanan Anda.`
  );
};

export const getWhatsAppDirectLink = (order: OrderPayload): string => {
  const message = generateWhatsAppOrderMessage(order);
  const encodedText = encodeURIComponent(message);
  // Normalize WA number (e.g. 085113661387 -> 6285113661387)
  const cleanNumber = OFFICIAL_STORE_WA.replace(/^0/, '62');
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
};

export const sendMetaWhatsAppMessage = async (toPhoneNumber: string, messageText: string) => {
  const token = (process.env.WA_ACCESS_TOKEN || '').trim().replace(/^["']|["']$/g, '');
  const phoneNumberId = (process.env.WA_PHONE_NUMBER_ID || '').trim().replace(/^["']|["']$/g, '');

  if (!token || !phoneNumberId) {
    console.log('[Meta WhatsApp API] Skipping API dispatch (Missing WA_ACCESS_TOKEN or WA_PHONE_NUMBER_ID).');
    return { success: false, reason: 'Missing WA_ACCESS_TOKEN or WA_PHONE_NUMBER_ID' };
  }

  try {
    const cleanTo = toPhoneNumber.replace(/[^0-9]/g, '').replace(/^0/, '62');
    const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: { body: messageText },
      }),
    });

    const data = await response.json();
    console.log('[Meta WhatsApp API Result]:', data);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Meta WhatsApp API Error]:', err);
    return { success: false, error: err?.message };
  }
};

export const processAIWhatsAppBotMessage = (incomingMsg: string, senderPhone: string): string => {
  const lower = incomingMsg.toLowerCase();

  if (lower.includes('menu') || lower.includes('makanan') || lower.includes('harga')) {
    return (
      `Halo! Kedai Nyamleng menyediakan berbagai menu spesial cita rasa Malang:\n` +
      `• Bebek Goreng Sambal Hitam Madura (Rp 38.000)\n` +
      `• Ayam Goreng Kremes Nyamleng (Rp 28.000)\n` +
      `• Rawon Daging Sapi Malang (Rp 32.000)\n` +
      `• Paket Hemat Berdua (Rp 78.000)\n` +
      `• Es Teh Manis Jumbo (Rp 6.000)\n\n` +
      `Anda dapat melihat & memesan langsung melalui link menu digital kami:\nhttps://digital-menu-kedai-nyamleng.vercel.app`
    );
  }

  if (lower.includes('buka') || lower.includes('jam') || lower.includes('alamat') || lower.includes('lokasi')) {
    return (
      `Kedai Nyamleng Malang:\n` +
      `Alamat: Kota Malang, Jawa Timur\n` +
      `Jam Operasional: Setiap Hari (10:00 - 22:00 WIB)\n` +
      `Layanan: Takeaway & Delivery (GrabSend, GoSend, InDrive, Shopee SPX)`
    );
  }

  if (lower.includes('bayar') || lower.includes('qris') || lower.includes('rekening')) {
    return (
      `Kedai Nyamleng menerima pembayaran full via QRIS Statis All Payment.\n` +
      `Dapat di-scan via GoPay, OVO, DANA, ShopeePay, BCA, Mandiri, BRI, BNI, dan semua M-Banking!`
    );
  }

  if (lower.includes('status') || lower.includes('pesanan') || lower.includes('proses')) {
    return (
      `Untuk memantau progress pesanan Anda secara realtime, silakan buka link pemantauan dapur pada website kami ` +
      `atau kirimkan Nomor Order Anda (contoh: #KDN-123456) agar admin kami bantu cek!`
    );
  }

  return (
    `Halo! Terima kasih telah menghubungi WhatsApp Official Kedai Nyamleng Malang.\n\n` +
    `Ada yang bisa AI Assistant kami bantu?\n` +
    `1. Ketik *Menu* untuk lihat daftar menu favorit\n` +
    `2. Ketik *Lokasi* untuk cek jam buka & alamat toko\n` +
    `3. Ketik *Bayar* untuk info pembayaran QRIS\n` +
    `4. Ketik *Status* untuk cek status pesanan Anda\n\n` +
    `Atau pesan langsung melalui website: https://digital-menu-kedai-nyamleng.vercel.app`
  );
};
