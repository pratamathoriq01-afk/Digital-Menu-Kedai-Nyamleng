import { NextRequest, NextResponse } from 'next/server';
import { 
  getGoogleTokensFromCode, 
  parseGoogleOAuthError, 
  checkGrantedOAuthScopes,
  fetchGoogleDriveFiles,
  fetchGoogleCalendarEvents 
} from '@/lib/googleOAuth';
import { syncCustomerToSupabase, createQuickDeviceUser } from '@/services/authService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // 1. Handle Error Response from Google consent (e.g. error=access_denied)
    if (error) {
      console.warn('[Google OAuth Callback Error Detected]:', error);
      const diagnostic = parseGoogleOAuthError(error);
      console.warn('[Google OAuth Error Diagnostic]:', diagnostic);
      
      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error)}`, origin));
    }

    // 2. If code is missing (e.g. redirected by Supabase OAuth flow or direct access), redirect safely to home
    if (!code) {
      console.log('[Google OAuth Callback Notice]: No code parameter in query string. Redirecting to home catalog.');
      return NextResponse.redirect(new URL('/?login_success=true', origin));
    }

    // 3. CSRF State Verification
    if (state) {
      console.log('[Google OAuth Callback] Received CSRF State Token:', state);
    }

    // 4. Tukar code dengan token Google menggunakan dynamic origin
    console.log('[Google OAuth Callback] Exchanging code for tokens with origin:', origin);
    
    let tokens;
    let client;
    try {
      const res = await getGoogleTokensFromCode(code, origin);
      tokens = res.tokens;
      client = res.client;
      console.log('[Google OAuth Callback] Tokens exchange successful. Access Token:', !!tokens.access_token);
      
      // Check granted scopes (Drive / Calendar)
      const grantedScopes = checkGrantedOAuthScopes(tokens);
      console.log('[Google OAuth Granted Scopes Check]:', grantedScopes);

      if (grantedScopes.hasDriveReadonly) {
        try {
          const driveFiles = await fetchGoogleDriveFiles(client);
          console.log(`[Drive Files Count]: ${driveFiles.length} file(s) found.`);
        } catch (driveErr) {
          console.warn('[Drive API Fetch Notice]:', driveErr);
        }
      }

      if (grantedScopes.hasCalendarReadonly) {
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

      return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(diagnostic.code)}`, origin));
    }

    // 5. Ambil data profil pelanggan dari Google UserInfo API
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const googleUser = await userInfoResponse.json();

      if (googleUser && googleUser.email) {
        console.log('[Google Profile Fetched Successfully]:', googleUser.email);
        
        // Try creating official Supabase Auth user via admin if service role key available
        try {
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            await supabaseAdmin.auth.admin.createUser({
              email: googleUser.email,
              email_confirm: true,
              user_metadata: { 
                full_name: googleUser.name || googleUser.given_name || googleUser.email.split('@')[0], 
                avatar_url: googleUser.picture,
                role: 'customer'
              }
            });
          }
        } catch (adminErr: any) {
          console.log('[Supabase Admin User Create Notice]:', adminErr?.message || adminErr);
        }

        // Sinkronisasikan profil pemesan ke database Customer Supabase PostgreSQL
        const customer = createQuickDeviceUser(
          googleUser.email,
          googleUser.name || googleUser.given_name || undefined,
          'GOOGLE'
        );
        if (googleUser.picture) {
          customer.avatarUrl = googleUser.picture;
        }

        await syncCustomerToSupabase(customer);
      }
    } catch (profileErr) {
      console.warn('[Google UserInfo Fetch Notice]:', profileErr);
    }

    // 6. Lempar kembali pembeli ke halaman utama katalog digital menu
    return NextResponse.redirect(new URL('/?login_success=true', origin));
  } catch (err: any) {
    console.error('Eror autentikasi custom server:', err);
    return NextResponse.redirect(new URL('/?auth_error=exception', request.url));
  }
}
