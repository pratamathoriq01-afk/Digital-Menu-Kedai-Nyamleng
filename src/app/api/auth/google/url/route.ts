import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthorizationUrl, generateOAuthState } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const state = generateOAuthState();
    const authorizationUrl = generateGoogleAuthorizationUrl(undefined, state, undefined, origin);

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
    return NextResponse.json({ error: err?.message || 'Failed to generate authorization URL' }, { status: 500 });
  }
}
