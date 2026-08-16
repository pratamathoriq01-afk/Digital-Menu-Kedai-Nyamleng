import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicAuthUrl, generateOAuthState, getGoogleOAuthClient } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Otomatis membaca port aktif (3000, 3001, atau domain Vercel)
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  try {
    const state = generateOAuthState();
    const oauth2Client = getGoogleOAuthClient(origin);
    const authUrl = generateDynamicAuthUrl(origin, state);

    console.log('[googleapis OAuth2] Detected Origin:', origin);
    console.log('[googleapis OAuth2] Generated Authorization URL:', authUrl);

    // Mengembalikan JSON berisi url otorisasi (Mendukung data.url & data.authorizationUrl)
    return NextResponse.json({
      success: true,
      url: authUrl,
      authorizationUrl: authUrl,
      state,
    });
  } catch (err: any) {
    console.error('[Generate Authorization URL Error]:', err);
    return NextResponse.json({ error: err?.message || 'Gagal membuat URL autentikasi' }, { status: 500 });
  }
}
