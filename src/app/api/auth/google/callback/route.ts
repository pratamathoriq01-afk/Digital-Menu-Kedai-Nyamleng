import { NextRequest, NextResponse } from 'next/server';
import { getGoogleTokensFromCode } from '@/lib/googleOAuth';
import { syncCustomerToSupabase, createQuickDeviceUser } from '@/services/authService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.warn('[Google OAuth Callback Error]:', error);
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    console.log('[Google OAuth Callback] Exchanging code for tokens...');
    const tokens = await getGoogleTokensFromCode(code);
    console.log('[Google OAuth Callback] Tokens exchange successful:', { access_token: !!tokens.access_token, refresh_token: !!tokens.refresh_token });

    return NextResponse.redirect(new URL('/?login_success=true', req.url));
  } catch (err: any) {
    console.error('[Google OAuth Callback Exception]:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
