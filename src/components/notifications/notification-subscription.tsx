'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, X, Smartphone, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface NotificationSettings {
  enabled: boolean;
  events: {
    match: boolean;
    tournament: boolean;
    donation: boolean;
    score: boolean;
  };
}

interface NotificationSubscriptionProps {
  userId?: string;
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
}

export function NotificationSubscription({ 
  userId,
  onSubscribe,
  onUnsubscribe 
}: NotificationSubscriptionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    events: {
      match: true,
      tournament: true,
      donation: true,
      score: true,
    },
  });

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window && 'serviceWorker' in navigator);
      setPermission(Notification.permission);
      
      // Check subscription status
      checkSubscriptionStatus();
    }
  }, [userId]);

  const checkSubscriptionStatus = async () => {
    try {
      const res = await fetch(`/api/notifications?action=status&userId=${userId || 'anonymous'}`);
      const data = await res.json();
      if (data.success) {
        setIsSubscribed(data.isSubscribed);
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported) {
      toast.error('Browser tidak mendukung push notification');
      return;
    }

    setIsLoading(true);

    try {
      // Request permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('Izin notifikasi ditolak');
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const vapidRes = await fetch('/api/notifications?action=vapid');
      const vapidData = await vapidRes.json();
      
      if (!vapidData.success) {
        throw new Error('Failed to get VAPID key');
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.vapidPublicKey),
      });

      // Save subscription to server
      const events = Object.entries(settings.events)
        .filter(([, enabled]) => enabled)
        .map(([event]) => event);

      const saveRes = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId,
          events,
        }),
      });

      const saveData = await saveRes.json();
      
      if (saveData.success) {
        setIsSubscribed(true);
        setSettings(prev => ({ ...prev, enabled: true }));
        toast.success('Notifikasi diaktifkan!');
        onSubscribe?.();
      } else {
        throw new Error(saveData.error);
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast.error('Gagal mengaktifkan notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Remove from server
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      setIsSubscribed(false);
      setSettings(prev => ({ ...prev, enabled: false }));
      toast.success('Notifikasi dinonaktifkan');
      onUnsubscribe?.();
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast.error('Gagal menonaktifkan notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEvent = useCallback((event: keyof typeof settings.events) => {
    setSettings(prev => ({
      ...prev,
      events: {
        ...prev.events,
        [event]: !prev.events[event],
      },
    }));
  }, []);

  // Helper to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!isSupported) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-slate-500" />
          <div>
            <p className="text-sm font-medium text-slate-400">Push Notification Tidak Didukung</p>
            <p className="text-xs text-slate-500">Browser Anda tidak mendukung push notification</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Toggle */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              isSubscribed ? "bg-emerald-500/20" : "bg-slate-700"
            )}>
              {isSubscribed ? (
                <Bell className="w-5 h-5 text-emerald-400" />
              ) : (
                <BellOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">Push Notification</p>
              <p className="text-xs text-slate-400">
                {isSubscribed ? 'Aktif - Anda akan menerima notifikasi' : 'Tidak aktif'}
              </p>
            </div>
          </div>
          
          <Button
            onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
            disabled={isLoading}
            className={cn(
              "min-w-[120px]",
              isSubscribed 
                ? "bg-slate-700 hover:bg-slate-600" 
                : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90"
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Loading...
              </span>
            ) : isSubscribed ? (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Nonaktifkan
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Aktifkan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Event Settings */}
      <AnimatePresence>
        {isSubscribed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <p className="text-sm font-medium text-slate-400">Jenis Notifikasi:</p>
            
            <div className="grid gap-2">
              {[
                { key: 'match', label: 'Pertandingan', desc: 'Mulai & selesai pertandingan', icon: '🏓' },
                { key: 'tournament', label: 'Turnamen', desc: 'Update status turnamen', icon: '🏆' },
                { key: 'donation', label: 'Donasi', desc: 'Donasi & saweran masuk', icon: '💝' },
                { key: 'score', label: 'Skor', desc: 'Update skor real-time', icon: '📊' },
              ].map((item) => (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                    settings.events[item.key as keyof typeof settings.events]
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-slate-900/30 border-slate-800"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.events[item.key as keyof typeof settings.events]}
                    onCheckedChange={() => toggleEvent(item.key as keyof typeof settings.events)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Warning */}
      {permission === 'denied' && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">
            ⚠️ Notifikasi diblokir. Buka pengaturan browser untuk mengizinkan.
          </p>
        </div>
      )}
    </div>
  );
}

// Notification Toast Component
export function NotificationToast({ 
  title, 
  body, 
  icon 
}: { 
  title: string; 
  body: string; 
  icon?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-4 right-4 z-50 p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-xl max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon || '🔔'}</div>
        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="text-sm text-slate-400">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}
