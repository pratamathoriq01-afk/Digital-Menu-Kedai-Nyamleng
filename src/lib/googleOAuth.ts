import { OAuth2Client, Credentials } from 'google-auth-library';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '899274496131-nvvt5soqunfe5v1a08t5p9r3fha4g1qq.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'https://digital-menu-kedai-nyamleng.vercel.app/api/auth/google/callback';

export const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Automatic Token Refresh Listener
oauth2Client.on('tokens', async (tokens: Credentials) => {
  if (tokens.refresh_token) {
    console.log('[Google OAuth Listener] New Refresh Token Acquired:', tokens.refresh_token);
  }
  if (tokens.access_token) {
    console.log('[Google OAuth Listener] New Access Token Acquired:', tokens.access_token);
  }
});

export const defaultScopes = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
];

/**
 * Generate a secure 32-byte hex random state string to mitigate CSRF attacks
 */
export const generateOAuthState = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate Google OAuth Authorization URL with offline access, incremental scopes, and CSRF state token
 */
export const generateGoogleAuthorizationUrl = (customScopes?: string[], state?: string) => {
  const oauthState = state || generateOAuthState();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: customScopes || defaultScopes,
    include_granted_scopes: true,
    state: oauthState,
    prompt: 'select_account'
  });
};

export const getGoogleTokensFromCode = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

export const setGoogleCredentials = (credentials: Credentials) => {
  oauth2Client.setCredentials(credentials);
};

/**
 * Revoke a Google OAuth 2.0 Access Token / Refresh Token
 */
export const revokeGoogleToken = async (token: string) => {
  try {
    const response = await fetch('https://oauth2.googleapis.com/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token }).toString(),
    });

    return { success: response.ok, status: response.status };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

export interface GoogleOAuthErrorDiagnostic {
  code: string;
  title: string;
  description: string;
  resolution: string;
}

/**
 * Diagnostic mapping for standard Google OAuth 2.0 Error Codes
 */
export const parseGoogleOAuthError = (errorCode: string): GoogleOAuthErrorDiagnostic => {
  const code = errorCode.toLowerCase().trim();

  switch (code) {
    case 'redirect_uri_mismatch':
      return {
        code: 'redirect_uri_mismatch',
        title: 'Redirect URI Tidak Cocok',
        description: 'URL Callback redirect_uri yang dikirim dalam request otorisasi tidak terdaftar di Authorized Redirect URIs Google Cloud Console.',
        resolution: 'Buka Google Cloud Console > Credentials > Edit Client ID, lalu tambahkan "https://digital-menu-kedai-nyamleng.vercel.app/api/auth/google/callback" ke Authorized redirect URIs.'
      };
    case 'disallowed_useragent':
      return {
        code: 'disallowed_useragent',
        title: 'Embedded WebView Tidak Diizinkan',
        description: 'Google menolak otorisasi OAuth dari browser WebView yang tertanam (misal WebView aplikasi internal iOS WKWebView).',
        resolution: 'Buka link otorisasi di browser default sistem operasi (Chrome, Safari, SFSafariViewController).'
      };
    case 'invalid_client':
      return {
        code: 'invalid_client',
        title: 'Client Secret / ID Tidak Valid',
        description: 'Google Client Secret atau Client ID yang digunakan dalam request tidak cocok.',
        resolution: 'Periksa GOOGLE_CLIENT_SECRET dan NEXT_PUBLIC_GOOGLE_CLIENT_ID di environment variables.'
      };
    case 'deleted_client':
      return {
        code: 'deleted_client',
        title: 'OAuth Client Telah Dihapus',
        description: 'OAuth Client ID yang digunakan telah dihapus dari Google Cloud Console.',
        resolution: 'Pulihkan OAuth Client ID di Google Cloud Console (dalam 30 hari) atau buat Client ID baru.'
      };
    case 'invalid_grant':
      return {
        code: 'invalid_grant',
        title: 'Token Kadaluwarsa / Tidak Valid',
        description: 'Refresh token atau authorization code telah kadaluwarsa atau dibatalkan oleh pengguna.',
        resolution: 'Lakukan autentikasi ulang pembeli untuk mendapatkan refresh_token baru.'
      };
    case 'admin_policy_enforced':
      return {
        code: 'admin_policy_enforced',
        title: 'Dibatasi Kebijakan Admin Workspace',
        description: 'Akun Google Workspace pengguna dibatasi oleh kebijakan Administrator Google Workspace.',
        resolution: 'Minta Administrator Google Workspace untuk menyetujui izin aplikasi Kedai Nyamleng.'
      };
    case 'org_internal':
      return {
        code: 'org_internal',
        title: 'Dibatasi Organisasi Internal',
        description: 'Project Google OAuth hanya diizinkan untuk pengguna dalam organisasi Google Cloud tertentu.',
        resolution: 'Ubah User Type di OAuth Consent Screen Google Cloud Console menjadi "External".'
      };
    case 'invalid_request':
    default:
      return {
        code: code || 'invalid_request',
        title: 'Request Otorisasi Tidak Valid',
        description: 'Request otorisasi tidak diformat dengan benar atau ada parameter wajib yang hilang.',
        resolution: 'Pastikan seluruh parameter (client_id, redirect_uri, response_type, scope, state) terisi dengan benar.'
      };
  }
};
