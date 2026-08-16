import { NextRequest, NextResponse } from 'next/server';
import { fetchGoogleUserProfile } from '@/lib/googleOAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const profile = await fetchGoogleUserProfile();
    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (err: any) {
    console.error('[Fetch Google UserInfo Error]:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to call Google UserInfo API',
    }, { status: 400 });
  }
}
