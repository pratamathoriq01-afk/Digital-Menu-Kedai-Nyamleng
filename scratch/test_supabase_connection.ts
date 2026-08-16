import { supabase } from '../src/lib/supabaseClient';

async function testSupabase() {
  console.log('=== TESTING SUPABASE DATABASE CONNECTION ===');
  try {
    const { data, error } = await supabase.from('Customer').select('*').limit(5);
    
    if (error) {
      console.warn('[Supabase Connection Notice]:', error.message);
    } else {
      console.log('[Supabase DB Connection Successful!]:', data?.length || 0, 'customer record(s) fetched.');
      console.log('Sample Data:', data);
    }
  } catch (err: any) {
    console.error('[Supabase Test Exception]:', err?.message);
  }
  console.log('============================================\n');
}

testSupabase();
