'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Crown, RefreshCw, Sparkles } from 'lucide-react';
import { useAppStore, Division, divisionThemes } from '@/store';
import { cn } from '@/lib/utils';

interface PrizePoolData {
  championAmount: number;
  runnerUpAmount: number;
  thirdPlaceAmount: number;
  mvpAmount: number;
  totalAmount: number;
  saweranTotal: number;
}

const defaultPrize: PrizePoolData = {
  championAmount: 0,
  runnerUpAmount: 0,
  thirdPlaceAmount: 0,
  mvpAmount: 0,
  totalAmount: 0,
  saweranTotal: 0,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export function PrizePool() {
  const { activeDivision } = useAppStore();
  const theme = divisionThemes[activeDivision];
  const [prize, setPrize] = useState<PrizePoolData>(defaultPrize);
  const [isLoading, setIsLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<string | null>(null);

  const fetchPrizePool = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      // Fetch active tournament for this division
      const res = await fetch(`/api/tournaments?division=${activeDivision}`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        // Get the most recent tournament
        const tournament = data.data[0];
        setTournamentId(tournament.id);
        
        if (tournament.prizePool) {
          // Calculate base prize (fixed amounts set by admin)
          const basePrize = 
            (tournament.prizePool.championAmount || 0) +
            (tournament.prizePool.runnerUpAmount || 0) +
            (tournament.prizePool.thirdPlaceAmount || 0) +
            (tournament.prizePool.mvpAmount || 0);
          
          // Fetch saweran total for this prize pool
          const saweranRes = await fetch(`/api/saweran?prizePoolId=${tournament.prizePool.id}`);
          const saweranData = await saweranRes.json();
          const saweranTotal = saweranData.total || 0;
          
          // totalAmount from database already includes saweran (incremented on approval)
          // If totalAmount is 0 but we have basePrize or saweranTotal, calculate it
          const totalAmount = tournament.prizePool.totalAmount || (basePrize + saweranTotal);
          
          setPrize({
            championAmount: tournament.prizePool.championAmount || 0,
            runnerUpAmount: tournament.prizePool.runnerUpAmount || 0,
            thirdPlaceAmount: tournament.prizePool.thirdPlaceAmount || 0,
            mvpAmount: tournament.prizePool.mvpAmount || 0,
            totalAmount: totalAmount,
            saweranTotal: saweranTotal,
          });
        } else {
          setPrize(defaultPrize);
        }
      } else {
        setPrize(defaultPrize);
        setTournamentId(null);
      }
    } catch (error) {
      console.error('Error fetching prize pool:', error);
      setPrize(defaultPrize);
    } finally {
      setIsLoading(false);
    }
  }, [activeDivision]);

  useEffect(() => {
    fetchPrizePool();
  }, [activeDivision, fetchPrizePool]);

  // Auto-refresh every 60 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrizePool(false);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchPrizePool]);

  const prizeItems = [
    { icon: Trophy, label: 'Juara 1', value: prize.championAmount, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { icon: Medal, label: 'Juara 2', value: prize.runnerUpAmount, color: 'text-slate-300', bg: 'bg-slate-500/10' },
    { icon: Medal, label: 'Juara 3', value: prize.thirdPlaceAmount, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { icon: Star, label: 'MVP', value: prize.mvpAmount, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  const accentColors = {
    MALE: { border: 'border-red-500/30', glow: 'rgba(239, 68, 68, 0.1)' },
    FEMALE: { border: 'border-purple-500/30', glow: 'rgba(168, 85, 247, 0.1)' },
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            Prize Pool
          </h3>
          <div className="h-6 w-24 bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="rounded-xl border border-slate-700 p-4 animate-pulse">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // No prize pool data
  if (prize.totalAmount === 0 && prize.saweranTotal === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            Prize Pool
          </h3>
        </div>
        <div 
          className={cn(
            "rounded-xl border p-4 text-center",
            "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
            accentColors[activeDivision].border
          )}
        >
          <Crown className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-slate-500 text-sm">Prize pool belum tersedia</p>
          <p className="text-slate-600 text-xs mt-1">akan diupdate segera</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 px-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-400" />
          Prize Pool
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPrizePool()}
            disabled={isLoading}
            aria-label="Refresh data prize pool"
            className="p-1 rounded bg-slate-800/50 border border-slate-700 text-slate-500 hover:text-white transition-colors"
          >
            <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
          </button>
          <div 
            className={cn(
              "px-3 py-1 rounded-full text-xs font-bold",
              "bg-gradient-to-r text-white",
              activeDivision === 'MALE' && "from-red-500 to-red-600",
              activeDivision === 'FEMALE' && "from-purple-500 to-pink-500"
            )}
            style={{
              boxShadow: `0 0 10px ${theme.neonColor}50`,
            }}
          >
            {formatCurrency(prize.totalAmount)}
          </div>
        </div>
      </div>

      <div 
        className={cn(
          "rounded-xl border p-4",
          "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
          accentColors[activeDivision].border
        )}
        style={{
          boxShadow: `0 0 20px ${accentColors[activeDivision].glow}`,
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {prizeItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  item.bg
                )}
              >
                <Icon className={cn("w-5 h-5", item.color)} />
                <div>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className={cn("text-sm font-semibold", item.color)}>
                    {formatCurrency(item.value)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Saweran Contribution */}
        {prize.saweranTotal > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Dari Saweran</span>
              </div>
              <span className="text-sm font-bold text-emerald-400">
                +{formatCurrency(prize.saweranTotal)}
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-3 pt-3 border-t border-slate-700/50 text-center">
          <p className="text-xs text-slate-500">
            💡 Prize pool dapat bertambah dari saweran
          </p>
        </div>
      </div>
    </motion.div>
  );
}
