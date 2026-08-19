import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pqebwoigkmeothadtzjr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkMenu() {
  const { data, error } = await supabase.from('MenuItem').select('*');
  console.log('Error:', error);
  console.log('Count:', data?.length);
  console.log('Data:', JSON.stringify(data, null, 2));
}

checkMenu();
