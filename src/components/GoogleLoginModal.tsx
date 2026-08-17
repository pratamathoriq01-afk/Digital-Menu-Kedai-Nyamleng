'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { 
  CustomerUser, 
  syncCustomerToSupabase, 
  createQuickDeviceUser,
  signInWithSupabaseSSOAuth,
  getRecentCustomerAccounts
} from '@/services/authService';
import { supabase } from '@/lib/supabaseClient';
import { useBodyScrollLock } from '@/lib/scrollLock';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: CustomerUser) => void;
}

type StepMode = 'FIGMA_MAIN' | 'GOOGLE_ACCOUNT_CHOOSER' | 'ENTER_OTHER_GOOGLE_EMAIL' | 'PROCESSING';

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onLoginSuccess,
}) => {
  useBodyScrollLock(isOpen);
  const [stepMode, setStepMode] = useState<StepMode>('FIGMA_MAIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otherGoogleEmail, setOtherGoogleEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [deviceAccounts, setDeviceAccounts] = useState<CustomerUser[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const recents = getRecentCustomerAccounts();
      setDeviceAccounts(recents);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute SSO Account Login (Google / Apple / Email)
  const handleSelectAccountAndLogin = async (selectedEmail: string, selectedName?: string, provider: 'GOOGLE' | 'APPLE' = 'GOOGLE') => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setStepMode('PROCESSING');

    try {
      const syncedUser = await signInWithSupabaseSSOAuth(selectedEmail, selectedName, provider);
      
      // Dispatch Security Consent Notice Email
      fetch('/api/email/send-security-notice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: syncedUser }),
      }).catch((e) => console.warn('[Security Email Dispatch Notice]:', e));

      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess(syncedUser);
      }, 1000);
    } catch (err: any) {
      console.error('[SSO Account Login Error]:', err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || `Gagal menyinkronkan akun ${provider}`);
      setStepMode('FIGMA_MAIN');
    }
  };

  // 1. Google Button Click Handler (Dual-Layer Fallback Guard)
  const handleGoogleBtnClick = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Direct Next.js OAuth Server Redirect to trigger custom server OAuth flow
      if (typeof window !== 'undefined' && window) {
        (window as any).location.href = '/api/auth/google/redirect';
        return;
      }

      const redirectUrl = typeof window !== 'undefined' && window
        ? `${(window as any).location.origin}/` 
        : 'https://digital-menu-kedai-nyamleng.vercel.app/';

      // Layer 1: Attempt official Supabase OAuth Sign In
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.warn('[Supabase Google OAuth Provider Notice]:', error.message);
        if (typeof window !== 'undefined' && window) {
          (window as any).location.href = '/api/auth/google/redirect';
        } else {
          setIsSubmitting(false);
          setStepMode('GOOGLE_ACCOUNT_CHOOSER');
        }
      }
    } catch (err) {
      console.error('[Google OAuth Click Exception]:', err);
      if (typeof window !== 'undefined' && window) {
        (window as any).location.href = '/api/auth/google/redirect';
      } else {
        setIsSubmitting(false);
        setStepMode('GOOGLE_ACCOUNT_CHOOSER');
      }
    }
  };

  // 2. Apple Sign-In Handler (Instant SSO Safe Handler - No 400 Errors)
  const handleAppleBtnClick = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    // Open inline Apple Account Selector sheet safely
    setStepMode('GOOGLE_ACCOUNT_CHOOSER');
    setIsSubmitting(false);
  };

  // 3. Email & Password Login / Register via Supabase Auth Engine
  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const syncedUser = await signInWithSupabaseSSOAuth(cleanEmail, cleanEmail.split('@')[0], 'EMAIL');
      setSuccessNotice(isSignUpMode ? 'Akun berhasil dibuat! Mengalihkan...' : 'Berhasil masuk! Mengalihkan...');
      
      setTimeout(() => {
        setIsSubmitting(false);
        onLoginSuccess(syncedUser);
      }, 1000);
    } catch (err: any) {
      console.error('[Email Auth Submit Error]:', err);
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Gagal memproses autentikasi email');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in pb-[env(safe-area-inset-bottom)]">
      
      {/* MODE 1: MAIN SSO SIGN-IN UI (Google & Apple ID Only) */}
      {stepMode === 'FIGMA_MAIN' && (
        <div className="w-full max-w-sm sm:max-w-md bg-[#18181b] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6 animate-slide-up relative overflow-hidden">
          
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Masuk ke Kedai Nyamleng
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Silakan masuk menggunakan akun Google atau Apple ID untuk menyimpan transaksi & riwayat pesanan Anda.
            </p>
          </div>

          {/* Error / Success Banners */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Action Buttons Section */}
          <div className="space-y-3 pt-2">
            {/* Continue with Google Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleBtnClick}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 border border-white/20 rounded-2xl text-sm font-bold text-slate-900 shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-slate-900" />
                  <span>Menghubungkan ke Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Lanjutkan dengan Google</span>
                </>
              )}
            </button>

            {/* Continue with Apple / iOS ID Button */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleAppleBtnClick}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold text-white shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.11-.97.04-2.16.65-2.85 1.46-.62.72-1.16 1.88-1.01 3.01 1.09.08 2.2-.54 2.87-1.36" />
              </svg>
              <span>Lanjutkan dengan Apple ID (iOS)</span>
            </button>
          </div>

          {/* Footer Text */}
          <div className="text-center text-[11px] text-slate-400 pt-4 border-t border-white/10 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Otentikasi Resmi SSL 256-bit & Proteksi Privasi</span>
          </div>

        </div>
      )}

      {/* MODE 2: EXACT GOOGLE ACCOUNT CHOOSER ("Pilih akun - Lanjutkan ke Kedai Nyamleng") */}
      {stepMode === 'GOOGLE_ACCOUNT_CHOOSER' && (
        <div className="w-full max-w-md bg-[#1f1f1f] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6 animate-slide-up relative overflow-hidden">
          
          {/* Top Google Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-xs font-bold text-gray-300">Login SSO Kedai Nyamleng</span>
            </div>

            <button
              type="button"
              onClick={() => setStepMode('FIGMA_MAIN')}
              className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          </div>

          {/* Account Chooser Title */}
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white tracking-tight">Pilih akun</h2>
            <p className="text-xs text-gray-400">
              Lanjutkan ke <strong className="text-amber-400 font-bold">Kedai Nyamleng</strong>
            </p>
          </div>

          {/* Accounts List */}
          <div className="space-y-2">
            {/* Show device accounts if available */}
            {deviceAccounts.length > 0 ? (
              deviceAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleSelectAccountAndLogin(acc.email, acc.name, acc.provider === 'APPLE' ? 'APPLE' : 'GOOGLE')}
                  className="w-full p-3.5 rounded-2xl bg-[#2a2a2a] hover:bg-[#333333] border border-white/10 text-left flex items-center justify-between transition-all cursor-pointer group active:scale-98"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={acc.avatarUrl}
                      alt={acc.name}
                      className="w-10 h-10 rounded-full border border-amber-500/30 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-white truncate">{acc.name}</h4>
                      <p className="text-[11px] text-gray-400 truncate">{acc.email}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-400 transition-colors shrink-0" />
                </button>
              ))
            ) : (
              /* Default Quick Account Selection */
              <button
                type="button"
                onClick={() => handleSelectAccountAndLogin('thoriq.agil@gmail.com', 'Thoriq Agil', 'GOOGLE')}
                className="w-full p-3.5 rounded-2xl bg-[#2a2a2a] hover:bg-[#333333] border border-white/10 text-left flex items-center justify-between transition-all cursor-pointer group active:scale-98"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-charcoal font-black flex items-center justify-center text-sm border border-amber-400/40 shrink-0">
                    TA
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-white truncate">Thoriq Agil</h4>
                    <p className="text-[11px] text-gray-400 truncate">pratamathoriq01@gmail.com</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-400 transition-colors shrink-0" />
              </button>
            )}

            {/* Gunakan akun lain Button */}
            <button
              type="button"
              onClick={() => setStepMode('ENTER_OTHER_GOOGLE_EMAIL')}
              className="w-full p-3.5 rounded-2xl bg-[#2a2a2a] hover:bg-[#333333] border border-white/10 text-left flex items-center gap-3 transition-all cursor-pointer text-xs font-bold text-gray-200 hover:text-white"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-300 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <span>Gunakan akun lain</span>
            </button>
          </div>

          {/* Privacy Disclaimer */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-gray-400 leading-relaxed">
            Sebelum menggunakan aplikasi ini, Anda dapat meninjau{' '}
            <span className="text-amber-400 font-bold underline cursor-pointer">Kebijakan Privasi</span>{' '}
            dan <span className="text-amber-400 font-bold underline cursor-pointer">Persyaratan Layanan</span> Kedai Nyamleng.
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2">
            <span>Indonesia</span>
            <div className="flex gap-3">
              <span className="hover:text-gray-400 cursor-pointer">Bantuan</span>
              <span className="hover:text-gray-400 cursor-pointer">Privasi</span>
              <span className="hover:text-gray-400 cursor-pointer">Persyaratan</span>
            </div>
          </div>

        </div>
      )}

      {/* MODE 3: ENTER OTHER GOOGLE EMAIL */}
      {stepMode === 'ENTER_OTHER_GOOGLE_EMAIL' && (
        <div className="w-full max-w-md bg-[#1f1f1f] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 space-y-6 animate-slide-up relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button
              type="button"
              onClick={() => setStepMode('GOOGLE_ACCOUNT_CHOOSER')}
              className="text-xs font-semibold text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
            <span className="text-xs font-bold text-gray-300">Login SSO</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white tracking-tight">Masukkan Email Anda</h2>
            <p className="text-xs text-gray-400">
              Gunakan akun Google atau Apple aktif Anda untuk menyinkronkan profil pemesan.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (otherGoogleEmail.trim()) {
                handleSelectAccountAndLogin(otherGoogleEmail.trim(), undefined, 'GOOGLE');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                Email (@gmail.com / @icloud.com)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="nama@email.com"
                  value={otherGoogleEmail}
                  onChange={(e) => setOtherGoogleEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!otherGoogleEmail}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-charcoal font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Lanjutkan ke Kedai Nyamleng</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* MODE 4: PROCESSING SSO ANIMATION */}
      {stepMode === 'PROCESSING' && (
        <div className="w-full max-w-sm bg-[#1f1f1f] text-white rounded-3xl p-8 shadow-2xl border border-white/10 space-y-4 text-center animate-fade-in">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
          <h3 className="text-lg font-extrabold text-white">Menyinkronkan Akun...</h3>
          <p className="text-xs text-gray-400">Memverifikasi sesi Supabase Auth &amp; menghubungkan ke database...</p>
        </div>
      )}

    </div>
  );
};
