import { NextRequest, NextResponse } from 'next/server';
import { revokeGoogleToken } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token parameter' }, { status: 400 });
    }

    console.log('[Google Token Revoke API] Revoking token...');
    const result = await revokeGoogleToken(token);

    return NextResponse.json({
      success: result.success,
      status: result.status,
    });
  } catch (err: any) {
    console.error('[Google Token Revoke API Exception]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to revoke token' }, { status: 500 });
  }
}
