import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { action, codeMethod = 'SMS', pin, solutionId } = await request.json();

    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID || '1287651777760923';
    const accessToken = process.env.WA_ACCESS_TOKEN;
    const apiVersion = 'v19.0';

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'WA_ACCESS_TOKEN environment variable is not configured' },
        { status: 500 }
      );
    }

    // 1. Action: Request 6-Digit SMS / Voice Verification Code from Meta
    if (action === 'request_code') {
      const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/request_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          code_method: codeMethod, // 'SMS' or 'VOICE'
          language: 'id', // Indonesian
        }),
      });

      const data = await res.json();
      return NextResponse.json({
        success: res.ok,
        action: 'request_code',
        data,
      });
    }

    // 2. Action: Register / Login Phone Number with 6-Digit PIN
    if (action === 'register') {
      if (!pin) {
        return NextResponse.json(
          { success: false, message: 'Missing 6-digit PIN' },
          { status: 400 }
        );
      }

      const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          pin: pin,
        }),
      });

      const data = await res.json();
      return NextResponse.json({
        success: res.ok,
        action: 'register',
        data,
      });
    }

    // 3. Action: Set Solution Migration Intent (Migration between Meta Partners)
    if (action === 'set_migration_intent') {
      if (!solutionId) {
        return NextResponse.json(
          { success: false, message: 'Missing solutionId parameter' },
          { status: 400 }
        );
      }

      const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/set_solution_migration_intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          solution_id: solutionId,
        }),
      });

      const data = await res.json();
      return NextResponse.json({
        success: res.ok,
        action: 'set_migration_intent',
        data,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action. Valid actions: "request_code", "register", "set_migration_intent"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[WhatsApp Meta Registration Error]:', error);
    return NextResponse.json(
      { success: false, message: 'WhatsApp API call failed', error: error?.message },
      { status: 500 }
    );
  }
}
