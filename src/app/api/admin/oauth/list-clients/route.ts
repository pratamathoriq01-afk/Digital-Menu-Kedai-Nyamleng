import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    console.log('[Supabase Auth Admin] Listing OAuth Clients...');

    const { data, error } = await (supabaseAdmin.auth.admin as any).oauth?.listClients?.() || {};

    if (error) {
      console.error('[Supabase OAuth List Clients Error]:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      clients: data || [],
    });
  } catch (err: any) {
    console.error('[OAuth List Clients Route Exception]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to list OAuth clients' }, { status: 500 });
  }
}
