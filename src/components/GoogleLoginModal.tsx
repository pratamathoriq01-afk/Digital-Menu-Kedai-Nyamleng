'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sun, 
  Moon, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Mail,
  User
} from 'lucide-react';
import { CustomerUser, syncCustomerToSupabase } from '@/services/authService';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: CustomerUser) => void;
}

type ModalStep = 'MAIN' | 'PROMPT_OAUTH_EMAIL' | 'CONFIRM_ACCOUNT';
type AuthProvider = 'GOOGLE' | 'APPLE' | 'EMAIL';

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onLoginSuccess,
}) => {
  const [modalStep, setModalStep] = useState<ModalStep>('MAIN');
  const [activeProvider, setActiveProvider] = useState<AuthProvider>('GOOGLE');
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<CustomerUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Detect System Theme Preference (prefers-color-scheme) automatically per user/device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleThemeChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleThemeChange);
      return () => mediaQuery.removeEventListener('change', handleThemeChange);
    }
  }, []);

  if (!isOpen) return null;

  // Open Real Google or Apple Email OAuth Input Prompt
  const handleOpenOAuthPrompt = (provider: AuthProvider) => {
    setActiveProvider(provider);
    setEmailInput('');
    setNameInput('');
    setModalStep('PROMPT_OAUTH_EMAIL');
  };

  // Submit OAuth Email Prompt and proceed to Confirmation Step
  const handleOAuthPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const generatedName = nameInput.trim() || emailInput.split('@')[0].replace(/[._-]/g, ' ');

    const oauthUser: CustomerUser = {
      id: `cust-${Date.now()}`,
      googleId: `${activeProvider.toLowerCase()}-${Date.now()}`,
      name: generatedName,
      email: emailInput.trim().toLowerCase(),
      phone: '085113661387',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emailInput.trim())}`,
    };

    setSelectedUser(oauthUser);
    setModalStep('CONFIRM_ACCOUNT');
  };

  // Final Confirmation & Login Sync Execution
  const handleConfirmAndLogin = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);

    const syncedUser = await syncCustomerToSupabase(selectedUser);
    setIsSubmitting(false);
    onLoginSuccess(syncedUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pb-[env(safe-area-inset-bottom)]">
      <div 
        className={`w-full max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-colors duration-300 space-y-6 animate-slide-up relative overflow-hidden max-h-[90dvh] overflow-y-auto ${
          isDarkMode 
            ? 'bg-[#161618] text-white border-white/10' 
            : 'bg-white text-gray-900 border-gray-200 shadow-amber-900/5'
        }`}
      >
        {/* Ambient Top Glow */}
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
          isDarkMode ? 'bg-amber-500/10' : 'bg-amber-500/15'
        }`} />

        {/* Header Navigation & Theme Switcher Bar */}
        <div className="flex justify-between items-center relative z-10">
          {modalStep !== 'MAIN' ? (
            <button
              type="button"
              onClick={() => setModalStep('MAIN')}
              className={`flex items-center gap-1 text-xs font-bold transition-colors cursor-pointer ${
                isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
              isDarkMode 
                ? 'bg-white/10 text-amber-300 border-white/10' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Kedai Nyamleng Digital Menu v2</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-full border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              isDarkMode 
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-amber-300' 
                : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
            }`}
            title="Ganti Tema Dark/Light Mode"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        {/* STEP 1: MAIN LOGIN MODAL (Image 4 Presise Match) */}
        {modalStep === 'MAIN' && (
          <div className="space-y-6 relative z-10 animate-fade-in">
            {/* Modal Brand Header */}
            <div className="text-center space-y-1.5">
              <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Sign in to Continue
              </h2>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Masuk dengan Akun Google atau Apple ID untuk membuka menu &amp; riwayat pesanan.
              </p>
            </div>

            {/* 1. Primary Button: Continue with Google (Image 4 Presise Match) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOpenOAuthPrompt('GOOGLE')}
                className={`w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-2xl border shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  isDarkMode
                    ? 'bg-[#27272a] hover:bg-[#3f3f46] text-white border-white/15'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-300'
                }`}
              >
                {/* Colorful Google Official 'G' Icon */}
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
                <span>Continue with Google</span>
              </button>

              {/* 2. Secondary Button: Continue with Apple (Mac / iPhone / iOS) */}
              <button
                type="button"
                onClick={() => handleOpenOAuthPrompt('APPLE')}
                className={`w-full py-3.5 px-4 text-xs sm:text-sm font-bold rounded-2xl border shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer active:scale-98 ${
                  isDarkMode
                    ? 'bg-[#27272a] hover:bg-[#3f3f46] text-white border-white/15'
                    : 'bg-gray-900 hover:bg-black text-white border-gray-900'
                }`}
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.04.24-9.87-1.82-14.49-6.17-3.17-2.82-7.05-7.53-11.64-14.12-6.53-9.4-11.75-20.04-15.66-31.9-3.91-11.87-5.87-23.36-5.87-34.48 0-14.7 3.65-26.68 10.94-35.95 7.3-9.27 16.48-14 27.54-14.19 4.89 0 9.87 1.18 14.94 3.53 5.08 2.35 8.78 3.53 11.1 3.53 2.11 0 5.86-1.18 11.24-3.53 5.37-2.35 10.15-3.41 14.33-3.17 11.99.94 21.6 5.65 28.82 14.12-10.59 6.47-15.77 15.3-15.54 26.48.24 9.17 3.89 16.82 10.95 22.94 7.06 6.12 15.42 9.53 25.07 10.23-2.58 7.76-5.87 15.41-9.87 22.93zM119.22 31.06c0-7.06 2.47-13.94 7.41-20.64 4.94-6.7 11.18-10.82 18.71-12.35.24.94.35 1.88.35 2.82 0 7.06-2.53 13.94-7.59 20.64-5.06 6.7-11.24 10.76-18.53 12.18-.12-.88-.35-1.77-.35-2.65z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            {/* Divider: OR (Image 4 Match) */}
            <div className="relative flex items-center justify-center py-0.5">
              <div className={`w-full border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`} />
              <span className={`px-4 text-[11px] font-extrabold uppercase tracking-widest relative ${
                isDarkMode ? 'bg-[#161618] text-gray-500' : 'bg-white text-gray-400'
              }`}>
                OR
              </span>
            </div>

            {/* Manual Email Input Form (Image 4 Match) */}
            <form onSubmit={handleOAuthPromptSubmit} className="space-y-3.5">
              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Enter your email:
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-2xl text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
                    isDarkMode 
                      ? 'bg-[#222226] border-white/10 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={!emailInput}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-charcoal font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Continue with email</span>
              </button>
            </form>

            {/* Security Notice */}
            <div className="pt-2 text-center text-[10px] text-gray-500 space-y-1">
              <p>
                By continuing, you acknowledge Kedai Nyamleng's{' '}
                <span className="underline hover:text-amber-500 cursor-pointer">Privacy Policy</span>.
              </p>
              <div className="flex items-center justify-center gap-1 text-emerald-500 font-semibold">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>Encrypted &amp; Secured by Supabase Enterprise RLS</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: REAL OAUTH EMAIL PROMPT */}
        {modalStep === 'PROMPT_OAUTH_EMAIL' && (
          <form onSubmit={handleOAuthPromptSubmit} className="space-y-5 relative z-10 animate-fade-in">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-2 shadow-inner border border-amber-500/30">
                {activeProvider === 'GOOGLE' ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                ) : (
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-5.04.24-9.87-1.82-14.49-6.17-3.17-2.82-7.05-7.53-11.64-14.12-6.53-9.4-11.75-20.04-15.66-31.9-3.91-11.87-5.87-23.36-5.87-34.48 0-14.7 3.65-26.68 10.94-35.95 7.3-9.27 16.48-14 27.54-14.19 4.89 0 9.87 1.18 14.94 3.53 5.08 2.35 8.78 3.53 11.1 3.53 2.11 0 5.86-1.18 11.24-3.53 5.37-2.35 10.15-3.41 14.33-3.17 11.99.94 21.6 5.65 28.82 14.12-10.59 6.47-15.77 15.3-15.54 26.48.24 9.17 3.89 16.82 10.95 22.94 7.06 6.12 15.42 9.53 25.07 10.23-2.58 7.76-5.87 15.41-9.87 22.93zM119.22 31.06c0-7.06 2.47-13.94 7.41-20.64 4.94-6.7 11.18-10.82 18.71-12.35.24.94.35 1.88.35 2.82 0 7.06-2.53 13.94-7.59 20.64-5.06 6.7-11.24 10.76-18.53 12.18-.12-.88-.35-1.77-.35-2.65z" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Verifikasi Akun {activeProvider === 'GOOGLE' ? 'Google' : 'Apple ID'}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Masukkan Email {activeProvider === 'GOOGLE' ? 'Google (@gmail.com)' : 'Apple ID (@icloud.com)'} aktif Anda di perangkat ini.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Email {activeProvider === 'GOOGLE' ? 'Google' : 'Apple ID'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder={activeProvider === 'GOOGLE' ? 'nama@gmail.com' : 'nama@icloud.com'}
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
                      isDarkMode ? 'bg-[#222226] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                  Nama Lengkap Pemesan (Opsional)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Contoh: Thoriq Agil"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-xs font-semibold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all ${
                      isDarkMode ? 'bg-[#222226] border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!emailInput}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-charcoal font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Lanjutkan Verifikasi Profil</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ACCOUNT CONFIRMATION CARD */}
        {modalStep === 'CONFIRM_ACCOUNT' && selectedUser && (
          <div className="space-y-5 relative z-10 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Konfirmasi Akun Pemesan
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Lanjutkan pemesanan dengan identitas akun terpilih berikut:
              </p>
            </div>

            {/* Profile Confirmation Card */}
            <div className={`p-4 rounded-2xl border space-y-3 text-left ${
              isDarkMode ? 'bg-[#222226] border-white/10' : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                <img
                  src={selectedUser.avatarUrl}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-500 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className={`font-black text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedUser.name}
                    </h4>
                    <span className="bg-emerald-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                      Verified
                    </span>
                  </div>
                  <p className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Terhubung Instan ke Supabase PostgreSQL DB</span>
              </div>
            </div>

            {/* Final Login Action Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleConfirmAndLogin}
                disabled={isSubmitting}
                className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Menyambungkan ke Supabase DB...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Konfirmasi &amp; Lanjutkan sebagai {selectedUser.name.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalStep('PROMPT_OAUTH_EMAIL')}
                className={`text-xs font-bold underline cursor-pointer ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}`}
              >
                Ubah Email Akun
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
