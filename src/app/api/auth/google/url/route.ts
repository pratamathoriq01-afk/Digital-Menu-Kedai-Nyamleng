import { NextRequest, NextResponse } from 'next/server';
import { generateDynamicAuthUrl, generateOAuthState } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { headers } = request;
  const host = headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  try {
    const state = generateOAuthState();
    const authorizationUrl = generateDynamicAuthUrl(origin, state);

    console.log('[googleapis OAuth2] Origin:', origin);
    console.log('[googleapis OAuth2] Generated CSRF State:', state);
    console.log('[googleapis OAuth2] Generated Authorization URL:', authorizationUrl);
    
    return NextResponse.json({
      success: true,
      state,
      authorizationUrl,
    });
  } catch (err: any) {
    console.error('[Generate Authorization URL Error]:', err);
    return NextResponse.json({ error: err?.message || 'Gagal membuat URL autentikasi' }, { status: 500 });
  }
}
