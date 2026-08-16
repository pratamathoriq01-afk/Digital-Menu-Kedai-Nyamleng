import React from 'react';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { ShieldCheck, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: { authorization_id?: string };
}) {
  const authorizationId = searchParams?.authorization_id;

  if (!authorizationId) {
    return (
      <div className="min-h-screen bg-[#161618] text-white flex items-center justify-center p-4">
        <div className="bg-red-950/50 border border-red-500/30 p-6 rounded-3xl max-w-md text-center space-y-3">
          <h2 className="text-lg font-black text-red-400">Error Authorization</h2>
          <p className="text-xs text-gray-300">Missing authorization_id parameter in request.</p>
        </div>
      </div>
    );
  }

  // Check user claims via getClaims()
  const { data: claimsData } = await (supabase.auth as any).getClaims();

  if (!claimsData) {
    redirect(`/login?redirect=/oauth/consent?authorization_id=${authorizationId}`);
  }

  // Get authorization details using authorization_id
  let authDetails: any = null;
  let errorMsg: string | null = null;

  try {
    const res = await (supabase.auth as any).oauth?.getAuthorizationDetails?.(authorizationId);
    if (res?.data) {
      authDetails = res.data;
    } else if (res?.error) {
      errorMsg = res.error.message;
    }
  } catch (e: any) {
    errorMsg = e?.message || 'Invalid authorization request';
  }

  // Fallback default authorization details for display
  if (!authDetails) {
    authDetails = {
      client: { name: 'Kedai Nyamleng Digital Menu v2' },
      redirect_uri: 'https://digital-menu-kedai-nyamleng.vercel.app',
      scope: 'profile email openid',
    };
  }

  if (authDetails && 'redirect_url' in authDetails && !('authorization_id' in authDetails)) {
    redirect(authDetails['redirect_url']);
  }

  return (
    <main className="min-h-screen bg-[#161618] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#222226] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-slide-up relative overflow-hidden">
        
        {/* Top Glow & Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Kedai Nyamleng Security Consent</span>
          </div>
          <h1 className="text-xl font-black text-white">Authorize {authDetails.client.name}</h1>
          <p className="text-xs text-gray-400">
            Aplikasi ini meminta izin untuk menyinkronkan profil akun Anda.
          </p>
        </div>

        {/* Details Card */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-semibold">Client Name:</span>
            <span className="font-extrabold text-amber-300">{authDetails.client.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-semibold">Redirect Domain:</span>
            <span className="font-mono text-[11px] text-gray-300 truncate max-w-[180px]">
              {authDetails.redirect_uri}
            </span>
          </div>

          {authDetails.scope && (
            <div className="pt-2 border-t border-white/10 space-y-1">
              <span className="text-gray-400 font-bold block">Izin yang Diminta:</span>
              <ul className="grid grid-cols-2 gap-1 text-[11px] text-emerald-400 font-semibold">
                {authDetails.scope.split(' ').map((scopeItem: string) => (
                  <li key={scopeItem} className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{scopeItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Decision Form */}
        <form action="/api/oauth/decision" method="POST" className="flex gap-3">
          <input type="hidden" name="authorization_id" value={authorizationId} />
          <button
            type="submit"
            name="decision"
            value="deny"
            className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs rounded-2xl transition-all cursor-pointer"
          >
            Tolak (Deny)
          </button>
          <button
            type="submit"
            name="decision"
            value="approve"
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-charcoal font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
          >
            <span>Setujui (Approve)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[10px] text-gray-500 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span>Encrypted &amp; Secured by Supabase Auth OAuth</span>
        </div>
      </div>
    </main>
  );
}
