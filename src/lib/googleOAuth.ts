import { OAuth2Client } from 'google-auth-library';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '899274496131-nvvt5soqunfe5v1a08t5p9r3fha4g1qq.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'https://digital-menu-kedai-nyamleng.vercel.app/api/auth/google/callback';

export const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

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
