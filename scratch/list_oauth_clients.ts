import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listOAuthClients() {
  console.log('[Supabase Auth Admin] Listing OAuth Clients...');

  try {
    const { data, error } = await (supabase.auth.admin as any).oauth?.listClients?.() || {};

    if (error) {
      console.error('Error listing clients:', error);
    } else {
      console.log('OAuth clients:', data);
    }
  } catch (e) {
    console.error('Exception listing OAuth clients:', e);
  }
}

listOAuthClients();
