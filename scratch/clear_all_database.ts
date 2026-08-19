import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqebwoigkmeothadtzjr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAllTables() {
  console.log('🧹 [Supabase DB Full Reset] Starting complete database purge...');

  // 1. TransactionItem
  const { error: err1 } = await supabase.from('TransactionItem').delete().neq('id', 'keep_none_placeholder');
  console.log('Deleted TransactionItem:', err1 ? err1.message : 'SUCCESS ✅');

  // 2. Transaction
  const { error: err2 } = await supabase.from('Transaction').delete().neq('id', 'keep_none_placeholder');
  console.log('Deleted Transaction:', err2 ? err2.message : 'SUCCESS ✅');

  // 3. Customer
  const { error: err3 } = await supabase.from('Customer').delete().neq('id', 'keep_none_placeholder');
  console.log('Deleted Customer:', err3 ? err3.message : 'SUCCESS ✅');

  // 4. MonthlyArchive
  const { error: err4 } = await supabase.from('MonthlyArchive').delete().neq('id', 'keep_none_placeholder');
  console.log('Deleted MonthlyArchive:', err4 ? err4.message : 'SUCCESS ✅');

  // 5. MenuItem
  const { error: err5 } = await supabase.from('MenuItem').delete().neq('id', 'keep_none_placeholder');
  console.log('Deleted MenuItem:', err5 ? err5.message : 'SUCCESS ✅');

  // 6. Voucher
  const { error: err6 } = await supabase.from('Voucher').delete().neq('id', 'keep_none_placeholder');
  console.log('Deleted Voucher:', err6 ? err6.message : 'SUCCESS ✅');

  console.log('🎉 [Full Database Clear Complete] All tables have been completely reset to 0 rows!');
}

clearAllTables();
