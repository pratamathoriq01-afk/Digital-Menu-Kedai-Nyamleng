import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const decision = formData.get('decision') as string;
    const authorizationId = formData.get('authorization_id') as string;

    if (!authorizationId) {
      return NextResponse.json({ error: 'Missing authorization_id' }, { status: 400 });
    }

    console.log('[OAuth Decision API Processing]:', { authorizationId, decision });

    if (decision === 'approve') {
      try {
        const { data, error } = await (supabase.auth as any).oauth?.approveAuthorization?.(authorizationId) || {};
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (data?.redirect_url) {
          return NextResponse.redirect(data.redirect_url);
        }
      } catch (e: any) {
        console.warn('[Approve Authorization Exception]:', e);
      }
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      try {
        const { data, error } = await (supabase.auth as any).oauth?.denyAuthorization?.(authorizationId) || {};
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (data?.redirect_url) {
          return NextResponse.redirect(data.redirect_url);
        }
      } catch (e: any) {
        console.warn('[Deny Authorization Exception]:', e);
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  } catch (err: any) {
    console.error('[OAuth Decision Route Exception]:', err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
