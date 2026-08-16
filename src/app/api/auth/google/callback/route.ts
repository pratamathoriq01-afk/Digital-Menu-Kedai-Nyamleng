import { NextRequest, NextResponse } from 'next/server';
import { 
  getGoogleTokensFromCode, 
  parseGoogleOAuthError, 
  checkGrantedOAuthScopes,
  fetchGoogleDriveFiles,
  fetchGoogleCalendarEvents 
} from '@/lib/googleOAuth';
import { google } from 'googleapis';
import { syncCustomerToSupabase, createQuickDeviceUser } from '@/services/authService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // 1. Handle Error Response from Google consent (e.g. error=access_denied or error=redirect_uri_mismatch)
    if (error) {
      console.warn('[Google OAuth Callback Error Detected]:', error);
      const diagnostic = parseGoogleOAuthError(error);
      console.warn('[Google OAuth Error Diagnostic]:', diagnostic);
      
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, req.url));
    }

    // 2. CSRF State Verification
    if (state) {
      console.log('[Google OAuth Callback] Received CSRF State Token:', state);
    }

    // 3. Validate missing authorization code
    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
    }

    // 4. Exchange code for access & refresh tokens (access_type=offline) with dynamic origin client
    console.log('[Google OAuth Callback] Exchanging code for tokens with origin:', origin);
    
    let tokens;
    let client;
    try {
      const res = await getGoogleTokensFromCode(code, origin);
      tokens = res.tokens;
      client = res.client;
      console.log('[Google OAuth Callback] Tokens exchange successful. Access Token:', !!tokens.access_token);
      
      // 5. Check which scopes were granted by the user (Drive / Calendar / Profile)
      const grantedScopes = checkGrantedOAuthScopes(tokens);
      console.log('[Google OAuth Granted Scopes Check]:', grantedScopes);

      // Check Drive Readonly permission
      if (grantedScopes.hasDriveReadonly) {
        console.log('[Drive Scope Granted]: Listing files...');
        try {
          const driveFiles = await fetchGoogleDriveFiles(client);
          console.log(`[Drive Files Count]: ${driveFiles.length} file(s) found.`);
        } catch (driveErr) {
          console.warn('[Drive API Fetch Notice]:', driveErr);
        }
      }

      // Check Calendar Readonly permission
      if (grantedScopes.hasCalendarReadonly) {
        console.log('[Calendar Scope Granted]: Fetching upcoming events...');
        try {
          const calendarEvents = await fetchGoogleCalendarEvents(client);
          console.log(`[Calendar Events Count]: ${calendarEvents.length} event(s) found.`);
        } catch (calErr) {
          console.warn('[Calendar API Fetch Notice]:', calErr);
        }
      }
    } catch (exchangeErr: any) {
      const googleErrCode = exchangeErr?.response?.data?.error || exchangeErr?.message || 'invalid_grant';
      console.error('[Google OAuth Token Exchange Error]:', googleErrCode);

      const diagnostic = parseGoogleOAuthError(googleErrCode.includes('invalid_grant') ? 'invalid_grant' : googleErrCode);
      console.error('[Token Exchange Error Diagnostic]:', diagnostic);

      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(diagnostic.code)}`, req.url));
    }

    // 6. Fetch Google User Profile info (name, email, picture) using googleapis userinfo
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: client as any });
      const { data: googleProfile } = await oauth2.userinfo.get();
      
      if (googleProfile && googleProfile.email) {
        console.log('[Google Profile Fetched Successfully]:', googleProfile.email);
        const customer = createQuickDeviceUser(
          googleProfile.email,
          googleProfile.name || googleProfile.given_name || undefined,
          'GOOGLE'
        );
        if (googleProfile.picture) {
          customer.avatarUrl = googleProfile.picture;
        }

        await syncCustomerToSupabase(customer);
      }
    } catch (profileErr) {
      console.warn('[Google UserInfo Fetch Notice]:', profileErr);
    }

    return NextResponse.redirect(new URL('/?login_success=true', req.url));
  } catch (err: any) {
    console.error('[Google OAuth Callback Exception]:', err);
    return NextResponse.redirect(new URL('/?auth_error=exception', req.url));
  }
}
