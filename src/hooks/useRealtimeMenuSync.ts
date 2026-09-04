'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useCartStore } from '@/store/useCartStore';
import { fetchSupabaseStoreSettings, fetchSupabaseVouchers } from '@/services/supabaseMenuService';

/**
 * useRealtimeMenuSync
 * Centralized, bulletproof hook to manage Supabase Realtime synchronization
 * for Menu Items, AddOns, Store Settings, and Vouchers.
 * 
 * Features:
 * 1. 0ms instant push updates via PostgreSQL WAL replication
 * 2. Automatic socket re-establishment on mobile sleep / wake / visibilitychange / online events
 * 3. Strict lifecycle management (clean removeChannel to avoid memory leaks & zombie sockets)
 * 4. Fallback interval sync every 15s to guarantee fresh state
 */
export function useRealtimeMenuSync() {
  const fetchMenuItems = useCartStore((s) => s.fetchMenuItems);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribingRef = useRef<boolean>(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initRealtimeSubscription = useCallback(() => {
    if (isSubscribingRef.current) return;
    isSubscribingRef.current = true;

    // Clean up existing channel if any
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current);
      } catch (e) {
        console.warn('[RealtimeMenuSync] Error removing previous channel:', e);
      }
      channelRef.current = null;
    }

    const channelId = `realtime_menu_sync_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'MenuItem' },
        (payload) => {
          console.log('⚡ [Realtime POS Sync]: MenuItem updated by Kasir App:', payload.eventType, payload.new || payload.old);
          fetchMenuItems().catch((err) => console.warn('[RealtimeMenuSync] MenuItem refresh error:', err));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'AddOn' },
        (payload) => {
          console.log('⚡ [Realtime POS Sync]: AddOn updated by Kasir App:', payload.eventType, payload.new || payload.old);
          fetchMenuItems().catch((err) => console.warn('[RealtimeMenuSync] AddOn refresh error:', err));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'StoreSettings' },
        (payload) => {
          console.log('⚡ [Realtime POS Sync]: StoreSettings updated by Kasir App:', payload.eventType, payload.new);
          fetchSupabaseStoreSettings()
            .then((settings) => {
              if (settings) {
                useCartStore.setState({ storeSettings: settings });
              }
            })
            .catch((err) => console.warn('[RealtimeMenuSync] StoreSettings refresh error:', err));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Voucher' },
        (payload) => {
          console.log('⚡ [Realtime POS Sync]: Voucher updated by Kasir App:', payload.eventType);
          fetchSupabaseVouchers()
            .then((vouchers) => {
              if (vouchers && Array.isArray(vouchers)) {
                useCartStore.setState({ availableVouchers: vouchers });
              }
            })
            .catch((err) => console.warn('[RealtimeMenuSync] Voucher refresh error:', err));
        }
      )
      .subscribe((status, err) => {
        isSubscribingRef.current = false;
        console.log(`📡 [RealtimeMenuSync Channel ${channelId}] Status:`, status);
        if (err) {
          console.error(`❌ [RealtimeMenuSync Channel ${channelId}] Error:`, err);
        }

        // Auto-reconnect if channel encounters error or closes unexpectedly
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 [RealtimeMenuSync] Attempting channel reconnection...');
            initRealtimeSubscription();
          }, 3000);
        }
      });

    channelRef.current = channel;
  }, [fetchMenuItems]);

  useEffect(() => {
    // 1. Initial fetch on mount
    fetchMenuItems().catch(() => {});

    // 2. Initialize Realtime WebSocket channel
    initRealtimeSubscription();

    // 3. Fallback polling every 15s to safeguard against silent network stalls
    const pollInterval = setInterval(() => {
      fetchMenuItems().catch(() => {});
    }, 15000);

    // 4. Mobile & Tab Visibility Reconnection Engine
    // Critical for iOS Safari & Android Chrome when smartphone wakes up from sleep
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 [RealtimeMenuSync] App resumed from background. Syncing live data...');
        fetchMenuItems().catch(() => {});

        // If channel is not healthy, re-establish subscription
        if (!channelRef.current || (channelRef.current as any).state === 'closed') {
          initRealtimeSubscription();
        }
      }
    };

    const handleWindowFocus = () => {
      fetchMenuItems().catch(() => {});
    };

    const handleOnline = () => {
      console.log('🌐 [RealtimeMenuSync] Device came back online. Reconnecting socket & fetching data...');
      fetchMenuItems().catch(() => {});
      initRealtimeSubscription();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('online', handleOnline);

    // 5. Clean teardown on unmount
    return () => {
      clearInterval(pollInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('online', handleOnline);

      if (channelRef.current) {
        try {
          supabase.removeChannel(channelRef.current);
        } catch (e) {
          console.warn('[RealtimeMenuSync] Teardown error:', e);
        }
        channelRef.current = null;
      }
      isSubscribingRef.current = false;
    };
  }, [fetchMenuItems, initRealtimeSubscription]);
}
