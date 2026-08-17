import { OAuth2Client, Credentials } from 'google-auth-library';
import { google } from 'googleapis';
import crypto from 'crypto';

const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
const rawClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

const GOOGLE_CLIENT_ID = rawClientId.replace(/^["']|["']$/g, '').trim();
const GOOGLE_CLIENT_SECRET = rawClientSecret.replace(/^["']|["']$/g, '').trim();

/**
 * Mendapatkan instance OAuth2Client secara dinamis berdasarkan domain asal (origin)
 * @param origin - Contoh: 'http://localhost:3000' atau domain Vercel terdaftar
 */
export const getGoogleOAuthClient = (origin?: string): OAuth2Client => {
  const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const targetOrigin = origin || defaultOrigin;
  
  // Bersihkan trailing slash jika ada agar formatnya konsisten
  const cleanOrigin = targetOrigin.replace(/\/$/, '');
  
  // Gabungkan origin dengan path API callback default Anda
  const dynamicRedirectUri = `${cleanOrigin}/api/auth/google/callback`;

  return new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: dynamicRedirectUri, // Terbentuk otomatis secara dinamis
  });
};

export const createOAuth2Client = (origin?: string): OAuth2Client => {
  return getGoogleOAuthClient(origin);
};

export const oauth2Client = getGoogleOAuthClient();

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
 * Menghasilkan URL Autentikasi Google secara dinamis
 * @param origin - Domain tempat user mengeklik tombol login
 */
export const generateDynamicAuthUrl = (origin?: string, state?: string, loginHint?: string): string => {
  const client = getGoogleOAuthClient(origin);
  const oauthState = state || generateOAuthState();

  const options: any = {
    access_type: 'offline', // Meminta refresh token
    prompt: 'consent select_account',
    include_granted_scopes: true,
    state: oauthState,
    enable_granular_consent: true,
    scope: defaultScopes,
  };

  if (loginHint) {
    options.login_hint = loginHint;
  }

  return client.generateAuthUrl(options);
};

export const generateGoogleAuthorizationUrl = (
  customScopes?: string[], 
  state?: string, 
  loginHint?: string,
  origin?: string
) => {
  const client = getGoogleOAuthClient(origin);
  const oauthState = state || generateOAuthState();

  const options: any = {
    access_type: 'offline',
    scope: customScopes || defaultScopes,
    include_granted_scopes: true,
    state: oauthState,
    prompt: 'select_account',
    enable_granular_consent: true,
  };

  if (loginHint) {
    options.login_hint = loginHint;
  }

  return client.generateAuthUrl(options);
};

/**
 * Validate Redirect URI according to Google OAuth 2.0 Security Rules
 */
export const validateGoogleRedirectUri = (uri: string): { isValid: boolean; reason?: string } => {
  try {
    const parsed = new URL(uri);

    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return { isValid: false, reason: 'Redirect URI must use the HTTPS scheme, not plain HTTP.' };
    }

    const isRawIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);
    if (isRawIp && !isLocalhost) {
      return { isValid: false, reason: 'Hosts cannot be raw IP addresses (except localhost).' };
    }

    if (parsed.hostname.endsWith('googleusercontent.com')) {
      return { isValid: false, reason: 'Host domains cannot be googleusercontent.com.' };
    }

    if (parsed.username || parsed.password) {
      return { isValid: false, reason: 'Redirect URIs cannot contain userinfo subcomponents.' };
    }

    if (parsed.pathname.includes('/..') || parsed.pathname.includes('\\..')) {
      return { isValid: false, reason: 'Redirect URIs cannot contain path traversal (/.. or \\..).' };
    }

    if (parsed.hash) {
      return { isValid: false, reason: 'Redirect URIs cannot contain fragment components (#).' };
    }

    if (uri.includes('*') || uri.includes('%00') || uri.includes('\0')) {
      return { isValid: false, reason: 'Redirect URIs cannot contain wildcard or null characters.' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, reason: 'Invalid URL formatting.' };
  }
};

/**
 * Generate a secure 32-byte hex random state string to mitigate CSRF attacks
 */
export const generateOAuthState = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Incremental Authorization Helper: Requests additional scopes dynamically while preserving combined permissions
 */
export const generateIncrementalAuthUrl = (additionalScopes: string[], state?: string, loginHint?: string, origin?: string) => {
  const combinedScopes = Array.from(new Set([...defaultScopes, ...additionalScopes]));
  return generateGoogleAuthorizationUrl(combinedScopes, state, loginHint, origin);
};

/**
 * Token Exchange Helper (code -> tokens) with dynamic origin client
 */
export const getGoogleTokensFromCode = async (code: string, origin?: string) => {
  const client = getGoogleOAuthClient(origin);
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return { tokens, client };
};

export const setGoogleCredentials = (credentials: Credentials, client?: OAuth2Client) => {
  const targetClient = client || oauth2Client;
  targetClient.setCredentials(credentials);
};

/**
 * Call Google UserInfo API on behalf of the authorized user account
 */
export const fetchGoogleUserProfile = async (client?: OAuth2Client) => {
  const oauth2 = google.oauth2({ version: 'v2', auth: (client || oauth2Client) as any });
  const response = await oauth2.userinfo.get();
  return response.data;
};

/**
 * Call Google Drive API (drive.metadata.readonly)
 */
export const fetchGoogleDriveFiles = async (client?: OAuth2Client, pageSize: number = 10) => {
  const drive = google.drive({ version: 'v3', auth: (client || oauth2Client) as any });
  const response = await drive.files.list({
    pageSize,
    fields: 'nextPageToken, files(id, name)',
  });
  return response.data.files || [];
};

/**
 * Call Google Calendar API (calendar.readonly)
 */
export const fetchGoogleCalendarEvents = async (client?: OAuth2Client, maxResults: number = 10) => {
  const calendar = google.calendar({ version: 'v3', auth: (client || oauth2Client) as any });
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return response.data.items || [];
};

/**
 * Check if a specific scope has been granted in tokens.scope
 */
export const hasGrantedScope = (grantedScopes: string | string[] | undefined, targetScope: string): boolean => {
  if (!grantedScopes) return false;
  if (Array.isArray(grantedScopes)) {
    return grantedScopes.includes(targetScope);
  }
  return grantedScopes.split(' ').includes(targetScope);
};

/**
 * Verify granted scopes for profile, email, Drive, and Calendar
 */
export const checkGrantedOAuthScopes = (tokens: Credentials) => {
  const scopeStr = tokens.scope || '';
  return {
    hasProfile: hasGrantedScope(scopeStr, 'https://www.googleapis.com/auth/userinfo.profile'),
    hasEmail: hasGrantedScope(scopeStr, 'https://www.googleapis.com/auth/userinfo.email'),
    hasDriveReadonly: hasGrantedScope(scopeStr, 'https://www.googleapis.com/auth/drive.metadata.readonly'),
    hasCalendarReadonly: hasGrantedScope(scopeStr, 'https://www.googleapis.com/auth/calendar.readonly'),
    rawScopes: scopeStr
  };
};

/**
 * Revoke a Google OAuth 2.0 Access Token / Refresh Token (POST https://oauth2.googleapis.com/revoke)
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
    case 'access_denied':
      return {
        code: 'access_denied',
        title: 'Akses Ditolak oleh Pengguna',
        description: 'Pengguna memilih membatalkan atau menolak izin otorisasi pada layar Google Consent.',
        resolution: 'Tampilkan notifikasi di UI bahwa izin otorisasi diperlukan untuk melanjutkan login.'
      };
    case 'redirect_uri_mismatch':
      return {
        code: 'redirect_uri_mismatch',
        title: 'Redirect URI Tidak Cocok (mismatch)',
        description: 'URL Callback redirect_uri yang dikirim dalam request otorisasi tidak terdaftar di Authorized Redirect URIs Google Cloud Console.',
        resolution: 'Buka Google Cloud Console > Credentials > Edit Client ID, lalu tambahkan domain callback aktif Anda (termasuk /api/auth/google/callback) ke Authorized redirect URIs.'
      };
    case 'disallowed_useragent':
      return {
        code: 'disallowed_useragent',
        title: 'Embedded WebView Tidak Diizinkan',
        description: 'Google menolak otorisasi OAuth dari browser WebView yang tertanam (misal WebView aplikasi internal iOS WKWebView).',
        resolution: 'Alihkan otorisasi untuk membuka browser default sistem operasi (Chrome/Safari).'
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
