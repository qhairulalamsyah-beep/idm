'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  show: (notification: Omit<Notification, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const show = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newNotification = { ...notification, id };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto dismiss
    const duration = notification.duration || 5000;
    const timeout = setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      timeoutsRef.current.delete(id);
    }, duration);
    timeoutsRef.current.set(id, timeout);
  }, []);

  const success = useCallback((title: string, message?: string) => {
    show({ type: 'success', title, message });
  }, [show]);

  const error = useCallback((title: string, message?: string) => {
    show({ type: 'error', title, message });
  }, [show]);

  const warning = useCallback((title: string, message?: string) => {
    show({ type: 'warning', title, message });
  }, [show]);

  const info = useCallback((title: string, message?: string) => {
    show({ type: 'info', title, message });
  }, [show]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ show, success, error, warning, info, dismiss }}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onDismiss={() => dismiss(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-cyan-400" />,
  };

  const colors = {
    success: 'border-emerald-500/30 bg-emerald-500/10',
    error: 'border-red-500/30 bg-red-500/10',
    warning: 'border-yellow-500/30 bg-yellow-500/10',
    info: 'border-cyan-500/30 bg-cyan-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={cn(
        'pointer-events-auto w-80 p-4 rounded-xl border backdrop-blur-xl shadow-lg',
        'bg-slate-900/95',
        colors[notification.type]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{icons[notification.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white">{notification.title}</p>
          {notification.message && (
            <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </motion.div>
  );
}
