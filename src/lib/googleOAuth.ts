import { OAuth2Client, Credentials } from 'google-auth-library';

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

export const generateGoogleAuthorizationUrl = (customScopes?: string[]) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: customScopes || defaultScopes,
    include_granted_scopes: true,
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
 * Posts to https://oauth2.googleapis.com/revoke
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

    const isOk = response.ok;
    console.log('[Google OAuth Revoke Token]:', { status: response.status, ok: isOk });
    return { success: isOk, status: response.status };
  } catch (err: any) {
    console.error('[Google OAuth Revoke Token Exception]:', err);
    return { success: false, error: err?.message };
  }
};
