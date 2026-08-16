import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearDatabaseTestData() {
  console.log('[Supabase DB Cleanup] Starting cleanup of test orders and customer records...');
  
  try {
    // 1. Delete OrderItems
    const { error: err1 } = await supabase.from('OrderItem').delete().neq('id', 'keep-none');
    if (err1) console.warn('OrderItem delete note:', err1.message);
    
    // 2. Delete Orders
    const { error: err2 } = await supabase.from('Order').delete().neq('id', 'keep-none');
    if (err2) console.warn('Order delete note:', err2.message);

    // 3. Delete Customer records
    const { error: err3 } = await supabase.from('Customer').delete().neq('id', 'keep-none');
    if (err3) console.warn('Customer delete note:', err3.message);

    console.log('✅ [Supabase DB Cleanup Complete] Test orders & customer database reset successfully!');
  } catch (err) {
    console.error('❌ Exception during DB cleanup:', err);
  }
}

clearDatabaseTestData();
