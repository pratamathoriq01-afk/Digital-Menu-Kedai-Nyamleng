import crypto from 'crypto';

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

const header = {
  alg: 'HS256',
  kid: '9876543210',
  typ: 'JWT'
};

const payload = {
  iss: 'A1B2C3D4E5',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
  aud: 'https://appleid.apple.com',
  sub: '899274496131-nvvt5soqunfe5v1a08t5p9r3fha4g1qq.apps.googleusercontent.com',
};

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));
const signature = base64url(crypto.createHmac('sha256', 'KedaiNyamlengAppleSecretKey2026').update(`${encodedHeader}.${encodedPayload}`).digest());

const jwtToken = `${encodedHeader}.${encodedPayload}.${signature}`;

console.log('=== VALID APPLE OAUTH SECRET JWT TOKEN ===');
console.log(jwtToken);
console.log('==========================================');
