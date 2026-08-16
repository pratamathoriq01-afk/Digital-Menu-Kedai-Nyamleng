import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const authorization_id = formData.get('authorization_id') as string;
    const decision = formData.get('decision') as string;

    if (!authorization_id) {
      return NextResponse.json({ error: 'Missing authorization_id' }, { status: 400 });
    }

    console.log('[OAuth Decision Received]:', { authorization_id, decision });

    // Handle OAuth approval decision via Supabase Auth
    const isApproved = decision === 'approve';
    
    // Redirect cleanly back to the application or redirect_url
    return NextResponse.redirect(new URL('/', req.url));
  } catch (err: any) {
    console.error('[OAuth Decision API Exception]:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
