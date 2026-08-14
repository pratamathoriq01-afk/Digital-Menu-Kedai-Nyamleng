import { NextRequest, NextResponse } from 'next/server';
import { sendOrderReceiptEmail } from '@/services/emailService';
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

    const result = await sendOrderReceiptEmail(orderPayload);

    return NextResponse.json({
      success: true,
      message: `E-Receipt for order #${orderPayload.orderId} successfully dispatched to ${orderPayload.customerEmail}`,
      details: result,
    });
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to dispatch email receipt', error: error?.message },
      { status: 500 }
    );
  }
}
