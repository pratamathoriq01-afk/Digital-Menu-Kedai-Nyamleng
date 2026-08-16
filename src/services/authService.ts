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
    const { data: existing } = await supabase
      .from('Customer')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (existing) {
      setStoredCustomerUser(existing);
      return existing;
    }

    const newCustomer = {
      id: user.id || `cust-${Date.now()}`,
      googleId: user.googleId || `g-${Date.now()}`,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email)}`,
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

    setStoredCustomerUser(data);
    return data;
  } catch (err) {
    console.error('[syncCustomerToSupabase Exception]:', err);
    setStoredCustomerUser(user);
    return user;
  }
};
