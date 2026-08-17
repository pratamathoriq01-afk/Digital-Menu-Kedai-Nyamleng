import { NextRequest, NextResponse } from 'next/server';
import { processAIWhatsAppBotMessageAsync, sendMetaWhatsAppMessage } from '@/services/whatsappService';

// GET Handler: Verification for Meta Webhook URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = (process.env.WA_VERIFY_TOKEN || 'nyamleng_rahasia_123').trim().replace(/^["']|["']$/g, '');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook GET] Meta Webhook Verification Success!');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.warn('[WhatsApp Webhook GET] Verification failed. Token mismatch or missing mode.');
    return new NextResponse('Akses Ditolak', { status: 403 });
  }
}

// POST Handler: Automatically processes incoming WhatsApp messages with AI CS Agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WhatsApp Webhook POST] Received payload:', JSON.stringify(body, null, 2));

    // Extract message details from Meta payload
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message && message.type === 'text') {
      const senderPhone = message.from; // e.g. "6285330681371"
      const incomingText = message.text?.body || '';

      console.log(`[WhatsApp Webhook AI] Message from ${senderPhone}: "${incomingText}"`);

      // 1. Process AI CS Bot response asynchronously
      const aiReply = await processAIWhatsAppBotMessageAsync(incomingText, senderPhone);

      // 2. Dispatch AI response back to customer via Meta Cloud API
      if (aiReply && senderPhone) {
        await sendMetaWhatsAppMessage(senderPhone, aiReply);
        console.log(`[WhatsApp Webhook AI] Dispatched AI reply to ${senderPhone}: "${aiReply}"`);
      }
    }

    return NextResponse.json({ success: true, message: 'Event processed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('[WhatsApp Webhook POST Error]:', error);
    return NextResponse.json({ success: true, message: 'Event acknowledged with error fallback' }, { status: 200 });
  }
}

