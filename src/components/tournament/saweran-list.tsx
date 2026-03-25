'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users } from 'lucide-react';
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

export function SaweranList() {
  const [saweran, setSaweran] = useState<SaweranRecord[]>([]);
  const [totalSaweran, setTotalSaweran] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSaweran = async () => {
      try {
        const res = await fetch('/api/saweran');
        const data = await res.json();
        if (data.success) {
          // Filter only approved saweran
          const approved = (data.data || []).filter((s: { status: string }) => s.status === 'APPROVED');
          setSaweran(approved);
          setTotalSaweran(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching saweran:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSaweran();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-4 mt-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-32 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (saweran.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 mt-4"
    >
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 via-slate-900 to-slate-900 overflow-hidden card-3d"
        style={{
          boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-semibold text-white">Penyawer Terbaru</h4>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Total</p>
            <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalSaweran)}</p>
          </div>
        </div>

        {/* List */}
        <div className="p-3 space-y-2 max-h-40 overflow-y-auto">
          {saweran.slice(0, 5).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between py-2 px-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-emerald-400">{formatCurrency(item.amount)}</p>
            </motion.div>
          ))}
        </div>

        {/* Footer hint */}
        {saweran.length > 5 && (
          <div className="px-4 py-2 border-t border-emerald-500/10 text-center">
            <p className="text-xs text-slate-500">+{saweran.length - 5} penyawer lainnya</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
