import { OAuth2Client, Credentials } from 'google-auth-library';
import { google } from 'googleapis';
import crypto from 'crypto';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '899274496131-nvvt5soqunfe5v1a08t5p9r3fha4g1qq.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'https://digital-menu-kedai-nyamleng.vercel.app/api/auth/google/callback';

/**
 * 1. Initialize Google OAuth2 Client
 */
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
  'openid',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'
];

/**
 * 2. Validate Redirect URI according to Google OAuth 2.0 Security Rules
 */
export const validateGoogleRedirectUri = (uri: string): { isValid: boolean; reason?: string } => {
  try {
    const parsed = new URL(uri);

    // Rule 1: Scheme must be HTTPS (localhost exempted)
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      return { isValid: false, reason: 'Redirect URI must use the HTTPS scheme, not plain HTTP.' };
    }

    // Rule 2: Host cannot be raw IP address (localhost exempted)
    const isRawIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(parsed.hostname);
    if (isRawIp && !isLocalhost) {
      return { isValid: false, reason: 'Hosts cannot be raw IP addresses (except localhost).' };
    }

    // Rule 3: Host domain cannot be googleusercontent.com
    if (parsed.hostname.endsWith('googleusercontent.com')) {
      return { isValid: false, reason: 'Host domains cannot be googleusercontent.com.' };
    }

    // Rule 4: Cannot contain userinfo (username:password@host)
    if (parsed.username || parsed.password) {
      return { isValid: false, reason: 'Redirect URIs cannot contain userinfo subcomponents.' };
    }

    // Rule 5: Cannot contain path traversal (/.. or \..)
    if (parsed.pathname.includes('/..') || parsed.pathname.includes('\\..')) {
      return { isValid: false, reason: 'Redirect URIs cannot contain path traversal (/.. or \\..).' };
    }

    // Rule 6: Cannot contain hash fragments
    if (parsed.hash) {
      return { isValid: false, reason: 'Redirect URIs cannot contain fragment components (#).' };
    }

    // Rule 7: Cannot contain wildcards (*) or null characters
    if (uri.includes('*') || uri.includes('%00') || uri.includes('\0')) {
      return { isValid: false, reason: 'Redirect URIs cannot contain wildcard or null characters.' };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, reason: 'Invalid URL formatting.' };
  }
};

/**
 * 3. Generate a secure 32-byte hex random state string to mitigate CSRF attacks
 */
export const generateOAuthState = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * 4. Generate Google OAuth Authorization URL with offline access, incremental scopes, and CSRF state token
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

/**
 * 5. Incremental Authorization Helper: Requests additional scopes dynamically while preserving combined permissions
 */
export const generateIncrementalAuthUrl = (additionalScopes: string[], state?: string) => {
  const combinedScopes = Array.from(new Set([...defaultScopes, ...additionalScopes]));
  return generateGoogleAuthorizationUrl(combinedScopes, state);
};

/**
 * 6. Token Exchange Helper (code -> tokens)
 */
export const getGoogleTokensFromCode = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

export const setGoogleCredentials = (credentials: Credentials) => {
  oauth2Client.setCredentials(credentials);
};

/**
 * 7. Call Google UserInfo API on behalf of the authorized user account
 */
export const fetchGoogleUserProfile = async (client?: OAuth2Client) => {
  const oauth2 = google.oauth2({ version: 'v2', auth: client || oauth2Client });
  const response = await oauth2.userinfo.get();
  return response.data;
};

/**
 * 8. Call Google Drive API (drive.metadata.readonly)
 */
export const fetchGoogleDriveFiles = async (client?: OAuth2Client, pageSize: number = 10) => {
  const drive = google.drive({ version: 'v3', auth: client || oauth2Client });
  const response = await drive.files.list({
    pageSize,
    fields: 'nextPageToken, files(id, name)',
  });
  return response.data.files || [];
};

/**
 * 9. Call Google Calendar API (calendar.readonly)
 */
export const fetchGoogleCalendarEvents = async (client?: OAuth2Client, maxResults: number = 10) => {
  const calendar = google.calendar({ version: 'v3', auth: client || oauth2Client });
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
 * 10. Check if a specific scope has been granted in tokens.scope
 */
export const hasGrantedScope = (grantedScopes: string | string[] | undefined, targetScope: string): boolean => {
  if (!grantedScopes) return false;
  if (Array.isArray(grantedScopes)) {
    return grantedScopes.includes(targetScope);
  }
  return grantedScopes.split(' ').includes(targetScope);
};

/**
 * 11. Verify granted scopes for profile, email, Drive, and Calendar
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
 * 12. Revoke a Google OAuth 2.0 Access Token / Refresh Token (POST https://oauth2.googleapis.com/revoke)
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
        title: 'Redirect URI Tidak Cocok',
        description: 'URL Callback redirect_uri yang dikirim dalam request otorisasi tidak terdaftar di Authorized Redirect URIs Google Cloud Console.',
        resolution: 'Buka Google Cloud Console > Credentials > Edit Client ID, lalu tambahkan "https://digital-menu-kedai-nyamleng.vercel.app/api/auth/google/callback" ke Authorized redirect URIs.'
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
