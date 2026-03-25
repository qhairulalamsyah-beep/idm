'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, Sparkles, RefreshCw } from 'lucide-react';
import { useAppStore, Division } from '@/store';
import { cn } from '@/lib/utils';

interface SaweranRecord {
  id: string;
  name: string;
  amount: number;
  message?: string;
  status: string;
  createdAt: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

export function QuickStats() {
  const { activeDivision } = useAppStore();
  const [saweran, setSaweran] = useState<SaweranRecord[]>([]);
  const [totalSaweran, setTotalSaweran] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSaweran = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch('/api/saweran');
      const data = await res.json();
      if (data.success) {
        // Only show completed/approved saweran
        const completedSaweran = (data.data || []).filter((s: SaweranRecord) => s.status === 'COMPLETED');
        setSaweran(completedSaweran);
        setTotalSaweran(data.total || completedSaweran.reduce((sum: number, s: SaweranRecord) => sum + s.amount, 0));
      }
    } catch (error) {
      console.error('Error fetching saweran:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSaweran();
  }, [fetchSaweran]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSaweran(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchSaweran]);

  const divisionColors: Record<Division, { text: string; bg: string }> = {
    MALE: { text: 'text-red-400', bg: 'bg-red-500/20' },
    FEMALE: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
    LIGA: { text: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  };

  return (
    <div className="mt-6 px-4 space-y-4">
      {/* Saweran Section */}
      {saweran.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Sparkles className={cn("w-4 h-4", divisionColors[activeDivision].text)} />
              Penyawer Pekan Ini
            </h4>
            <button
              onClick={() => fetchSaweran()}
              disabled={isLoading}
              aria-label="Refresh data saweran"
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800/50 border border-slate-700 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </button>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {saweran.slice(0, 5).map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    divisionColors[activeDivision].bg
                  )}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold", divisionColors[activeDivision].text)}>
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
          {/* Total Saweran - Pojok kanan bawah */}
          <div className="flex justify-end mt-3 pt-3 border-t border-slate-700">
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Saweran</p>
              <p className={cn("text-base font-bold", divisionColors[activeDivision].text)}>
                {formatCurrency(totalSaweran)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {saweran.length === 0 && !isLoading && (
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 text-center">
          <Heart className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-slate-500 text-sm">Belum ada saweran</p>
          <p className="text-slate-600 text-xs">Jadilah penyawer pertama!</p>
        </div>
      )}
    </div>
  );
}
