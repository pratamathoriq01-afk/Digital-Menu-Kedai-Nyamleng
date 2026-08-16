import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthorizationUrl } from '@/lib/googleOAuth';

export async function GET(req: NextRequest) {
  try {
    const authorizationUrl = generateGoogleAuthorizationUrl();
    console.log('[googleapis OAuth2] Generated Authorization URL:', authorizationUrl);
    
    return NextResponse.json({
      success: true,
      authorizationUrl,
    });
  } catch (err: any) {
    console.error('[Generate Authorization URL Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate authorization URL' }, { status: 500 });
  }
}
