import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, redirect_uris, client_type, token_endpoint_auth_method } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pqebwoigkmeothadtzjr.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create Supabase Admin client using Service Role / Secret Key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    console.log('[Supabase Auth Admin] Creating OAuth Client:', { name, redirect_uris });

    // Call Supabase Auth Admin OAuth Create Client API
    const { data, error } = await (supabaseAdmin.auth.admin as any).oauth?.createClient?.({
      name: name || 'Kedai Nyamleng Digital Menu v2',
      redirect_uris: redirect_uris || ['https://digital-menu-kedai-nyamleng.vercel.app/auth/callback'],
      client_type: client_type || 'confidential',
      token_endpoint_auth_method: token_endpoint_auth_method || 'client_secret_basic',
    }) || {};

    if (error) {
      console.error('[Supabase OAuth Client Create Error]:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data,
      client_id: data?.client_id,
      client_secret: data?.client_secret,
    });
  } catch (err: any) {
    console.error('[OAuth Client Create Route Exception]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create OAuth client' }, { status: 500 });
  }
}
