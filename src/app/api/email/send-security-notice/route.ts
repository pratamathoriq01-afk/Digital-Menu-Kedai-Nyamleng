import { NextRequest, NextResponse } from 'next/server';
import { sendSecurityConsentEmail } from '@/services/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user } = body;

    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    console.log(`[API /api/email/send-security-notice] Dispatching Security Consent Email for ${user.email}...`);
    await sendSecurityConsentEmail(user);

    return NextResponse.json({
      success: true,
      message: `Notifikasi Keamanan Transparansi Profil berhasil dikirim ke ${user.email}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[API /api/email/send-security-notice Exception]:', err?.message || err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to send security consent email' },
      { status: 500 }
    );
  }
}
