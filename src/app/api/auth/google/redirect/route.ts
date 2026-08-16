import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicAuthUrl, generateOAuthState } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Deteksi domain asal secara otomatis dari header request server
  const { headers } = request;
  const host = headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  try {
    const state = generateOAuthState();
    // 2. Buat url login dengan redirect_uri yang sudah presisi
    const authUrl = generateDynamicAuthUrl(origin, state);
    
    console.log('[Google OAuth Redirect] Request Origin:', origin);
    console.log('[Google OAuth Redirect] Redirecting user to:', authUrl);

    // 3. Alihkan user ke halaman login Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[Google OAuth Redirect Error]:', error);
    return NextResponse.json({ error: 'Gagal membuat URL autentikasi' }, { status: 500 });
  }
}
