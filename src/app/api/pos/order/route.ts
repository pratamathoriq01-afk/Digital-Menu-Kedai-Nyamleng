import { NextRequest, NextResponse } from 'next/server';
import { OrderPayload } from '@/types/pos';

export async function POST(request: NextRequest) {
  try {
    const body: OrderPayload = await request.json();

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Order items cannot be empty' },
        { status: 400 }
      );
    }

    // Return POS sync response simulation
    return NextResponse.json({
      success: true,
      orderId: body.orderId,
      status: 'CONFIRMED',
      posSyncStatus: 'SYNCED',
      message: `Order #${body.orderId} successfully dispatched to POS Kasir & Kitchen Printer`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to process POS order' },
      { status: 500 }
    );
  }
}
