'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogIn, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function GoogleAuthNextPage() {
  const [authUrl, setAuthUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/auth/google/url')
      .then((res) => res.json())
      .then((data) => {
        if (data.authorizationUrl) {
          setAuthUrl(data.authorizationUrl);
        }
      })
      .catch((err) => console.error('Failed to load Google Auth URL:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Google OAuth 2.0 Integration
          </h1>
          <p className="text-sm text-slate-400">
            Otentikasi Akun Google Resmi Kedai Nyamleng (Next.js App Router)
          </p>
        </div>

        {/* Configuration Status Pills */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Environment Framework:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Next.js 14 App Router
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Client ID Status:</span>
            <span className="font-mono text-amber-300 text-[10px]">899274496131...apps</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Access Scopes:</span>
            <span className="text-slate-200 font-medium">Profile, Email, OpenID</span>
          </div>
        </div>

        {/* Main Action Button */}
        <div className="space-y-3">
          {loading ? (
            <button
              disabled
              className="w-full py-4 rounded-full bg-slate-800 text-slate-400 font-semibold flex items-center justify-center gap-2 cursor-wait"
            >
              <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              Menyiapkan URL Otorisasi...
            </button>
          ) : authUrl ? (
            <a
              href={authUrl}
              className="w-full py-4 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 group"
            >
              <span>Lanjutkan dengan Google</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          ) : (
            <Link
              href="/api/auth/google/redirect"
              className="w-full py-4 px-6 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 group"
            >
              <span>Otorisasi Langsung Server</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Dilindungi dengan CSRF State Token 32-Byte</span>
        </div>
      </div>
    </div>
  );
}
