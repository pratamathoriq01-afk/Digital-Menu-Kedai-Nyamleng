import { NextRequest, NextResponse } from 'next/server';
import { processAIWhatsAppBotMessage } from '@/services/whatsappService';

// GET Handler: Webhook Verification for Meta WhatsApp Cloud API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = (process.env.WA_VERIFY_TOKEN || 'nyamleng_rahasia_123').trim().replace(/^["']|["']$/g, '');

  console.log('[WhatsApp Webhook GET] Mode:', mode, 'Token:', token, 'Expected:', expectedToken);

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[WhatsApp Webhook] Verification successful!');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    { success: false, message: 'Forbidden: Invalid verification token' },
    { status: 403 }
  );
}

// POST Handler: Process incoming WhatsApp messages & respond with AI Bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WhatsApp Webhook POST] Received payload:', JSON.stringify(body));

    // Extract message content if payload is from Meta WhatsApp Cloud API
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const fromNumber = message.from;
      const text = message.text?.body || '';

      const botReply = processAIWhatsAppBotMessage(text, fromNumber);
      console.log(`[WhatsApp AI Bot] Reply to ${fromNumber}: ${botReply}`);

      return NextResponse.json({
        success: true,
        recipient: fromNumber,
        replyMessage: botReply,
      });
    }

    // Direct JSON message simulation support
    if (body.message && body.from) {
      const botReply = processAIWhatsAppBotMessage(body.message, body.from);
      return NextResponse.json({
        success: true,
        recipient: body.from,
        replyMessage: botReply,
      });
    }

    return NextResponse.json({ success: true, message: 'Webhook event received' });
  } catch (error: any) {
    console.error('[WhatsApp Webhook Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing error', error: error?.message },
      { status: 500 }
    );
  }
}
