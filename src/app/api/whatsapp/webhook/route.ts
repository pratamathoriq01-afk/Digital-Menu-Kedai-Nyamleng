import { NextRequest, NextResponse } from 'next/server';
import { processAIWhatsAppBotMessageAsync, sendMetaWhatsAppMessage } from '@/services/whatsappService';

// GET Handler: Digunakan oleh Meta Developer Dashboard saat verifikasi Webhook URL
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
    console.warn('[WhatsApp Webhook GET] Token mismatch:', token, 'expected:', VERIFY_TOKEN);
    return new NextResponse('Akses Ditolak', { status: 403 });
  }
}

// Helper Async Dispatcher function (Runs in background without blocking Meta HTTP response)
async function handleAsyncAiReply(fromNumber: string, incomingText: string) {
  try {
    console.log(`[WhatsApp AI Agent Background Task] Processing message from ${fromNumber}: "${incomingText}"`);
    
    // 1. Generate OpenAI GPT-4o-mini CS Reply
    const botReply = await processAIWhatsAppBotMessageAsync(incomingText, fromNumber);
    console.log(`[WhatsApp AI Agent Background Task] Reply generated for ${fromNumber}:\n${botReply}`);

    // 2. Dispatch Reply via Meta WhatsApp Cloud API
    const dispatchResult = await sendMetaWhatsAppMessage(fromNumber, botReply);
    console.log(`[WhatsApp AI Agent Background Task] Meta API Dispatch Result:`, dispatchResult);
  } catch (err) {
    console.error('[WhatsApp AI Agent Background Task Error]:', err);
  }
}

// POST Handler: Menerima event pesan masuk dari Meta WhatsApp Cloud API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WhatsApp Webhook POST Payload Received]:', JSON.stringify(body));

    // Extract message content if payload is from Meta WhatsApp Cloud API
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (message) {
      const fromNumber = message.from;
      const text = message.text?.body || '';

      // Trigger background processing asynchronously (Non-blocking)
      handleAsyncAiReply(fromNumber, text);

      // Return 200 OK IMMEDIATELY to Meta in < 50ms to prevent Meta Webhook Timeout
      return NextResponse.json(
        { success: true, status: 'EVENT_RECEIVED', recipient: fromNumber },
        { status: 200 }
      );
    }

    // Direct JSON message simulation support (For local developer testing)
    if (body.message && body.from) {
      const fromNumber = body.from;
      const text = body.message;

      // For direct developer simulation requests, execute & return full result
      const botReply = await processAIWhatsAppBotMessageAsync(text, fromNumber);
      const dispatchResult = await sendMetaWhatsAppMessage(fromNumber, botReply);

      return NextResponse.json({
        success: true,
        recipient: fromNumber,
        incomingMessage: text,
        replyMessage: botReply,
        dispatchResult,
      });
    }

    return NextResponse.json({ success: true, message: 'Webhook event processed' }, { status: 200 });
  } catch (error: any) {
    console.error('[WhatsApp Webhook POST Error]:', error);
    return NextResponse.json(
      { success: false, message: 'Webhook processing error', error: error?.message },
      { status: 500 }
    );
  }
}
