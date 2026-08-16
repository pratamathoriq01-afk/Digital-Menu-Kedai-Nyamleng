import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxZWJ3b2lna21lb3RoYWR0empyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwNjc4ODUsImV4cCI6MjEwMTY0Mzg4NX0.Bjgaby4hZRaYDywwaD0vRQR1pNyTbU6jPsd5FqZte24';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Attach native getClaims method onto supabase.auth instance
(supabase.auth as any).getClaims = async () => {
  try {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error || !sessionData?.session) {
      return { data: null, error: error || new Error('No active Supabase session') };
    }
    const user = sessionData.session.user;
    return {
      data: {
        sub: user.id,
        email: user.email,
        role: user.role,
        aud: user.aud,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err };
  }
};
