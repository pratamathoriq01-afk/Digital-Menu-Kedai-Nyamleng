import { NextRequest, NextResponse } from 'next/server';
import { sendMetaWhatsAppMessage } from '@/services/whatsappService';

export async function POST(request: NextRequest) {
  try {
    const { orderId, customerName, customerPhone, status, orderType, deliveryCourier } = await request.json();

    if (!customerPhone || !orderId || !status) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: customerPhone, orderId, or status' },
        { status: 400 }
      );
    }

    let statusMessage = '';
    if (status === 'CONFIRMED') {
      statusMessage =
        `*KEDAI NYAMLENG - UPDATE DAPUR REALTIME*\n` +
        `-----------------------------------------\n` +
        `Halo *${customerName || 'Pelanggan'}*, Pesanan Anda *#${orderId}* telah berhasil diterima oleh Kasir Kedai Nyamleng! 📝\n\n` +
        `Koki kami sedang bersiap memasak menu lezat Anda. Mohon ditunggu ya!`;
    } else if (status === 'KITCHEN_PROCESSING') {
      statusMessage =
        `*KEDAI NYAMLENG - PROSES MASAK DAPUR*\n` +
        `-----------------------------------------\n` +
        `Halo *${customerName || 'Pelanggan'}*, Koki Kedai Nyamleng saat ini *SEDANG MEMASAK* pesanan Anda *#${orderId}*! 👨‍🍳🔥\n\n` +
        `Estimasi waktu masak & penyajian ± 7-15 menit.`;
    } else if (status === 'READY') {
      const modeText = orderType === 'DELIVERY' 
        ? `Pesanan Anda sudah siap dan sedang dijemput oleh Kurir Delivery (${deliveryCourier || 'Grab/GoSend/Shopee'}) menuju alamat Anda! 🛵💨`
        : `Pesanan Anda telah SELESAI dimasak dan siap diambil di Konter Kasir Kedai Nyamleng! 🍱✨`;

      statusMessage =
        `*KEDAI NYAMLENG - PESANAN SELESAI & SIAP!*\n` +
        `-----------------------------------------\n` +
        `Halo *${customerName || 'Pelanggan'}*, kabar gembira! Pesanan Anda *#${orderId}* telah SELESAI! 🎉\n\n` +
        `${modeText}\n\n` +
        `Terima kasih telah memesan di Kedai Nyamleng Malang! Balas chat ini jika butuh bantuan AI Assistant kami.`;
    }

    if (statusMessage) {
      const dispatchResult = await sendMetaWhatsAppMessage(customerPhone, statusMessage);
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
