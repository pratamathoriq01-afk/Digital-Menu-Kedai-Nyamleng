import { generateGoogleAuthorizationUrl, generateOAuthState } from '../src/lib/googleOAuth';

async function verifyUrl() {
  const state = generateOAuthState();
  const url = generateGoogleAuthorizationUrl(undefined, state);
  console.log('\n=== GOOGLE OAUTH 2.0 AUTHORIZATION URL VERIFICATION ===');
  console.log('Generated State:', state);
  console.log('Generated URL:\n', url);
  console.log('========================================================\n');
}

verifyUrl();
