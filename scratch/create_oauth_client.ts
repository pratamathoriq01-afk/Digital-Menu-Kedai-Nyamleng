import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createOAuthClient() {
  console.log('[Supabase Auth Admin] Creating OAuth Client...');
  
  try {
    const { data, error } = await (supabase.auth.admin as any).oauth?.createClient?.({
      name: 'Kedai Nyamleng Official Third-Party App',
      redirect_uris: [
        'https://digital-menu-kedai-nyamleng.vercel.app/auth/callback',
        'https://digital-menu-kedai-nyamleng.vercel.app/auth/silent-callback'
      ],
      client_type: 'confidential',
      token_endpoint_auth_method: 'client_secret_basic',
    }) || {};

    if (error) {
      console.error('Error creating client:', error);
    } else if (data) {
      console.log('Client created successfully:', data);
      console.log('Client ID:', data.client_id);
      console.log('Client Secret:', data.client_secret);
    } else {
      console.log('OAuth Admin API executed.');
    }
  } catch (e) {
    console.error('Exception creating OAuth client:', e);
  }
}

createOAuthClient();
