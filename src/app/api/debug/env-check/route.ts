import { NextResponse } from 'next/server';

// Temporary debug endpoint - check if critical env vars are present on Vercel
export async function GET() {
  const envStatus = {
    GMAIL_USER: process.env.GMAIL_USER ? `${process.env.GMAIL_USER.substring(0, 5)}...` : 'NOT SET ❌',
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD 
      ? (process.env.GMAIL_APP_PASSWORD.includes('your16char') ? 'PLACEHOLDER (not real password) ⚠️' : 'SET ✅')
      : 'NOT SET ❌',
    WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID ? 'SET ✅' : 'NOT SET ❌',
    WA_ACCESS_TOKEN: process.env.WA_ACCESS_TOKEN ? 'SET ✅' : 'NOT SET ❌',
    WA_VERIFY_TOKEN: process.env.WA_VERIFY_TOKEN ? 'SET ✅' : 'NOT SET ❌',
    NEXT_PUBLIC_QRIS_STRING: process.env.NEXT_PUBLIC_QRIS_STRING 
      ? `SET ✅ (${process.env.NEXT_PUBLIC_QRIS_STRING.substring(0, 20)}...)`
      : 'NOT SET ❌',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET ✅' : 'NOT SET ❌',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET ✅' : 'NOT SET ❌',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET ✅' : 'NOT SET ❌',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET ✅' : 'NOT SET ❌',
    NEXT_PUBLIC_GOOGLE_REDIRECT_URI: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI 
      ? process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
      : 'NOT SET ❌',
  };

  return NextResponse.json({
    status: 'OK',
    environment: process.env.VERCEL_ENV || 'local',
    timestamp: new Date().toISOString(),
    envStatus,
  });
}
