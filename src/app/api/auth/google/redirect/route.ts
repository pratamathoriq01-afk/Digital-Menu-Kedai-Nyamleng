import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthorizationUrl, generateOAuthState } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const state = generateOAuthState();
    const authorizationUrl = generateGoogleAuthorizationUrl(undefined, state);

    console.log('[Google OAuth Redirect] Redirecting user to:', authorizationUrl);
    
    // Redirect browser directly to Google OAuth Authorization URL
    return NextResponse.redirect(authorizationUrl);
  } catch (err: any) {
    console.error('[Google OAuth Redirect Error]:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
