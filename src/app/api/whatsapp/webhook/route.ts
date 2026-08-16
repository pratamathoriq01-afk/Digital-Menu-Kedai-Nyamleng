import { NextRequest, NextResponse } from 'next/server';

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
    return new NextResponse('Akses Ditolak', { status: 403 });
  }
}

// POST Handler: Acknowledges incoming events without sending automated AI replies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[WhatsApp Webhook POST] Acknowledging incoming message without AI auto-reply');
    return NextResponse.json({ success: true, message: 'Event received' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: true, message: 'Event acknowledged' }, { status: 200 });
  }
}
