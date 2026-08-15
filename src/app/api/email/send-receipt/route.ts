import { NextRequest, NextResponse } from 'next/server';
import { sendOrderReceiptEmail } from '@/services/emailService';
import { generateWhatsAppOrderMessage, sendMetaWhatsAppMessage } from '@/services/whatsappService';
import { OrderPayload } from '@/types/pos';

export async function POST(request: NextRequest) {
  try {
    const orderPayload: OrderPayload = await request.json();

    if (!orderPayload || !orderPayload.customerEmail) {
      return NextResponse.json(
        { success: false, message: 'Invalid order payload or missing customer email' },
        { status: 400 }
      );
    }

    // 1. Dispatch Email Receipt
    const result = await sendOrderReceiptEmail(orderPayload);

    // 2. Dispatch Meta WhatsApp Confirmation Message (if phone number is present)
    let waResult = null;
    if (orderPayload.customerPhone) {
      const waMsg = generateWhatsAppOrderMessage(orderPayload);
      waResult = await sendMetaWhatsAppMessage(orderPayload.customerPhone, waMsg);
    }

    return NextResponse.json({
      success: true,
      message: `E-Receipt & WhatsApp Notification for order #${orderPayload.orderId} processed`,
      emailDetails: result,
      whatsappDetails: waResult,
    });
  } catch (error: any) {
    console.error('Order Notification Dispatch Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to dispatch order notification', error: error?.message },
      { status: 500 }
    );
  }
}
