import { NextRequest, NextResponse } from 'next/server';
import { sendMetaWhatsAppMessage } from '@/services/whatsappService';
import { STORE_LOCATION } from '@/types/pos';

// In-Memory Notification Deduplication Cache (Key: `${orderId}_${status}`)
const dispatchedNotifsCache = new Set<string>();

export async function POST(request: NextRequest) {
  try {
    const { orderId, customerName, customerPhone, status, orderType, deliveryCourier } = await request.json();

    if (!customerPhone || !orderId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: customerPhone, orderId, or status' },
        { status: 400 }
      );
    }

    // Deduplication Guard: Send EXACTLY ONCE per (orderId + status)
    const notifKey = `${orderId}_${status}`;
    if (dispatchedNotifsCache.has(notifKey)) {
      console.log(`[WA Deduplication Guard] Notification already sent for ${notifKey}. Skipping duplicate.`);
      return NextResponse.json({
        success: true,
        orderId,
        status,
        deduplicated: true,
        message: 'Notification already dispatched once. Duplicate suppressed.',
      });
    }

    let statusMessage = '';
    if (status === 'CONFIRMED') {
      statusMessage =
        `*KEDAI NYAMLENG MALANG - UPDATE DAPUR REALTIME*\n` +
        `-----------------------------------------\n` +
        `Halo *${customerName || 'Pelanggan'}*, kabar baik! Pesanan Anda *#${orderId}* telah berhasil DITERIMA oleh Kasir Kedai Nyamleng! 📝\n\n` +
        `Koki kami sedang bersiap memasak menu lezat Anda. Mohon ditunggu ya!`;
    } else if (status === 'KITCHEN_PROCESSING') {
      statusMessage =
        `*KEDAI NYAMLENG MALANG - PROSES MASAK DAPUR*\n` +
        `-----------------------------------------\n` +
        `Halo *${customerName || 'Pelanggan'}*, Koki Kedai Nyamleng saat ini *SEDANG MEMASAK* pesanan Anda *#${orderId}*! 👨‍🍳🔥\n\n` +
        `Estimasi waktu masak & penyajian ± 7-15 menit.`;
    } else if (status === 'READY') {
      const modeText = orderType === 'DELIVERY' 
        ? `Pesanan Anda telah SELESAI dimasak dan sedang dijemput oleh *Kurir Delivery (${deliveryCourier || 'GrabSend / GoSend / InDrive / SPX'})* menuju alamat Anda! 🛵💨`
        : `Pesanan Anda telah SELESAI dimasak dan SIAP diambil!\n\n📍 *Alamat Toko Kedai Nyamleng:*\n${STORE_LOCATION}\nSilakan datang ke toko untuk mengambil pesanan Anda di Konter Kasir! 🍱✨`;

      statusMessage =
        `*KEDAI NYAMLENG MALANG - PESANAN SELESAI & SIAP!*\n` +
        `-----------------------------------------\n` +
        `Halo *${customerName || 'Pelanggan'}*, kabar gembira! Pesanan Anda *#${orderId}* telah SELESAI! 🎉\n\n` +
        `${modeText}\n\n` +
        `Terima kasih telah memesan di Kedai Nyamleng Malang! Balas chat ini jika butuh bantuan AI Assistant kami.`;
    }

    if (statusMessage) {
      const dispatchResult = await sendMetaWhatsAppMessage(customerPhone, statusMessage);
      
      // Mark as dispatched so duplicate requests are suppressed
      dispatchedNotifsCache.add(notifKey);

      return NextResponse.json({
        success: true,
        orderId,
        status,
        dispatchResult,
      });
    }

    return NextResponse.json({ success: true, message: 'No status message needed' });
  } catch (error: any) {
    console.error('[WhatsApp Notify Progress Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send WA progress notification', error: error?.message },
      { status: 500 }
    );
  }
}
