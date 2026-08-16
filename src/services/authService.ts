import { supabase } from '@/lib/supabaseClient';

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  googleId?: string;
  createdAt?: string;
}

const CUSTOMER_AUTH_KEY = 'kedai_nyamleng_customer_user';

export const getStoredCustomerUser = (): CustomerUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredCustomerUser = (user: CustomerUser | null): void => {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CUSTOMER_AUTH_KEY);
  }
};

export const syncCustomerToSupabase = async (user: CustomerUser): Promise<CustomerUser> => {
  try {
    const cleanEmail = user.email.trim().toLowerCase();
    
    // Check existing customer record in Supabase PostgreSQL DB
    const { data: existing } = await supabase
      .from('Customer')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      console.log('[Supabase Sync] Existing Customer Profile Found:', existing);
      setStoredCustomerUser(existing);
      return existing;
    }

    const newCustomer = {
      id: user.id || `cust-${Date.now()}`,
      googleId: user.googleId || `g-${Date.now()}`,
      name: user.name || cleanEmail.split('@')[0].replace(/[._-]/g, ' '),
      email: cleanEmail,
      phone: user.phone || '085113661387',
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('Customer')
      .insert(newCustomer)
      .select()
      .single();

    if (error) {
      console.error('[Supabase Customer Insert Error]:', error.message);
      setStoredCustomerUser(newCustomer);
      return newCustomer;
    }

    console.log('[Supabase Sync] New Customer Profile Created:', data);
    setStoredCustomerUser(data);
    return data;
  } catch (err) {
    console.error('[syncCustomerToSupabase Exception]:', err);
    setStoredCustomerUser(user);
    return user;
  }
};

export const signInWithGoogleOAuth = async () => {
  if (typeof window === 'undefined') return;
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.warn('[Supabase Auth Google OAuth Notice]:', error.message);
    return data;
  } catch (e) {
    console.error('[Supabase Auth Google Exception]:', e);
  }
};

export const createQuickDeviceUser = (email: string, name?: string): CustomerUser => {
  const cleanEmail = email.trim().toLowerCase();
  const formatName = name?.trim() || cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
  const capitalizedName = formatName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    id: `google-${Date.now()}`,
    googleId: `g-${Date.now()}`,
    name: capitalizedName,
    email: cleanEmail,
    phone: '085113661387',
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
  };
};
