'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Bike, Clock, MapPin, Sparkles, Star, ShieldCheck, Menu, History, User } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { OrderType, STORE_LOCATION } from '@/types/pos';
import { Logo } from './Logo';
import { CustomerUser } from '@/services/authService';

interface HeaderProps {
  onOpenSidebarDrawer?: () => void;
  currentUser?: CustomerUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebarDrawer,
  currentUser,
}) => {
  const { 
    orderType, 
    setOrderType, 
    searchQuery, 
    setSearchQuery,
  } = useCartStore();

  // Realtime Clock State
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      };
      const formattedDate = now.toLocaleDateString('id-ID', dateOptions);
      const formattedTime = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      });
      setTimeString(`${formattedDate} • ${formattedTime} WIB`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOrderTypeChange = (type: OrderType) => {
    setOrderType(type);
  };

  return (
    <header className="relative w-full bg-white border-b border-parchment-border shadow-xs">
      {/* Top Utility Bar with Realtime Clock & Store Location */}
      <div className="bg-charcoal text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center text-xs gap-2">
          
          {/* Burger Bar (Garis Tiga) & Customer Profile Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSidebarDrawer}
              className="p-1.5 bg-nyamleng-600 hover:bg-nyamleng-700 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-95"
              title="Buka Riwayat Pesanan Saya & Profil Akun"
            >
              <Menu className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Riwayat Pesanan</span>
            </button>

            {currentUser && (
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 text-[11px] font-semibold text-amber-200">
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt={currentUser.name}
                  className="w-4 h-4 rounded-full border border-amber-300 bg-white"
                />
                <span className="max-w-[100px] truncate">{currentUser.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-nyamleng-400" />
              {STORE_LOCATION}
            </span>
          </div>

          {/* Realtime Live Clock Display */}
          <div className="hidden md:flex items-center gap-1.5 font-mono text-[11px] sm:text-xs text-amber-300 font-semibold bg-white/10 px-3 py-0.5 rounded-full border border-white/15 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span>{timeString || 'Loading time...'}</span>
          </div>
        </div>
      </div>

      {/* Sleek Hero Logo Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-parchment-soft via-white to-parchment py-5 sm:py-6 px-4 border-b border-parchment-border">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-nyamleng-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#e64a19_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
          
          {/* Top Decorative Tag */}
          <div className="inline-flex items-center gap-1.5 bg-nyamleng-50 border border-nyamleng-200 text-nyamleng-700 px-3 py-0.5 rounded-full text-[11px] font-bold mb-2 shadow-xs">
            <Sparkles className="w-3 h-3 text-nyamleng-500 animate-pulse" />
            <span>Menu Digital Terintegrasi POS • Malang 2026</span>
          </div>

          {/* Centered Logo */}
          <Logo size="md" className="my-0.5" />

          {/* Store Attribute Badges */}
          <div className="mt-3 flex flex-wrap justify-center items-center gap-2 text-xs font-semibold text-charcoal">
            <span className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-parchment-border shadow-xs text-[11px]">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              Rasa Nyamleng Asli
            </span>
            <span className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-parchment-border shadow-xs text-[11px]">
              <Clock className="w-3 h-3 text-emerald-600" />
              Buka: 08:00 - 22:00 WIB
            </span>
            <span className="flex items-center gap-1 bg-white/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-parchment-border shadow-xs text-[11px]">
              <ShieldCheck className="w-3 h-3 text-nyamleng-500" />
              POS Realtime Sync
            </span>
          </div>

        </div>
      </div>

      {/* Main Bar: Order Type Switcher & Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3.5">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          
          {/* Takeaway & Delivery Switcher */}
          <div className="flex bg-parchment-soft p-1 rounded-xl border border-parchment-border shadow-xs max-w-xs sm:max-w-none">
            <button
              onClick={() => handleOrderTypeChange('TAKEAWAY')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                orderType === 'TAKEAWAY'
                  ? 'bg-nyamleng-500 text-white shadow-sm'
                  : 'text-charcoal-light hover:text-charcoal hover:bg-white/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Takeaway (Ambil di Toko)
            </button>
            <button
              onClick={() => handleOrderTypeChange('DELIVERY')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all ${
                orderType === 'DELIVERY'
                  ? 'bg-nyamleng-500 text-white shadow-sm'
                  : 'text-charcoal-light hover:text-charcoal hover:bg-white/50'
              }`}
            >
              <Bike className="w-4 h-4" />
              Delivery (Antar Pesanan)
            </button>
          </div>

          {/* Search Bar Input */}
          <div className="relative flex-1 sm:w-72 md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari bebek, ayam, es kopi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-parchment-soft rounded-xl border border-parchment-border focus:outline-none focus:ring-2 focus:ring-nyamleng-500 focus:bg-white transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-charcoal"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
