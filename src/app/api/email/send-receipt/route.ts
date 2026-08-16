import { NextRequest, NextResponse } from 'next/server';
import { sendOrderReceiptEmail } from '@/services/emailService';
import { 
  generateWhatsAppOrderMessage, 
  generateWhatsAppDeliveryAddressRequestMessage, 
  sendMetaWhatsAppMessage 
} from '@/services/whatsappService';
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

    // 1. Dispatch Email Receipt (Hybrid Resend + Nodemailer Gmail SMTP)
    const emailResult = await sendOrderReceiptEmail(orderPayload);

    // 2. Dispatch Meta WhatsApp Confirmation Message (if phone number is present)
    let waResult = null;
    let waDeliveryResult = null;

    if (orderPayload.customerPhone) {
      // Message 1: Initial E-Receipt Struk
      const waMsg = generateWhatsAppOrderMessage(orderPayload);
      waResult = await sendMetaWhatsAppMessage(orderPayload.customerPhone, waMsg);

      // Message 2 (If Delivery): Courier Confirmation & Address Request Message
      if (orderPayload.orderType === 'DELIVERY') {
        const waDeliveryMsg = generateWhatsAppDeliveryAddressRequestMessage(orderPayload);
        waDeliveryResult = await sendMetaWhatsAppMessage(orderPayload.customerPhone, waDeliveryMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `E-Receipt & WhatsApp Notification for order #${orderPayload.orderId} processed`,
      emailDetails: emailResult,
      whatsappDetails: waResult,
      whatsappDeliveryAddressDetails: waDeliveryResult,
    });
  } catch (error: any) {
    console.error('Order Notification Dispatch Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to dispatch order notification', error: error?.message },
      { status: 500 }
    );
  }
}
