'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Trophy, Medal, Star, 
  Settings, LogOut, ChevronRight, Crown,
  Gamepad2, Target
} from 'lucide-react';
import { useAppStore, Division } from '@/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tierColors = {
  S: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  A: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  B: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

export function UserProfilePanel() {
  const { user, isAuthenticated, logout, openModal } = useAppStore();

  // Compute profile from user data
  const profile = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    
    return {
      id: user.id,
      name: user.name || 'Unknown',
      phone: user.phone,
      tier: 'A' as const,
      points: 250,
      wins: 5,
      losses: 2,
      tournaments: 3,
      history: [
        { id: '1', name: 'Tarkam #8', division: 'MALE' as Division, position: 1, date: '2025-01-15', prize: 300000 },
        { id: '2', name: 'Tarkam #7', division: 'MALE' as Division, position: 2, date: '2025-01-08', prize: 150000 },
      ],
    };
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="p-4 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 mx-auto mb-4 flex items-center justify-center border border-slate-700">
            <User className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Belum Login</h2>
          <p className="text-slate-400 text-sm mb-6">
            Login untuk mengakses profil lengkap
          </p>
          <Button
            onClick={() => openModal('login')}
            className="bg-gradient-to-r from-cyan-600 to-blue-600"
          >
            Login dengan WhatsApp
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-4 pb-24">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-cyan-500/30">
          {profile.name?.substring(0, 2).toUpperCase() || 'U'}
        </div>
        <h2 className="text-xl font-bold text-white">{profile.name}</h2>
        <p className="text-slate-400 text-sm">{profile.phone}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge className={cn(
            tierColors[profile.tier].bg,
            tierColors[profile.tier].text
          )}>
            Tier {profile.tier}
          </Badge>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-2 mb-6"
      >
        <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{profile.points}</p>
          <p className="text-xs text-slate-400">Points</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{profile.wins}</p>
          <p className="text-xs text-slate-400">Wins</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <Target className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{profile.losses}</p>
          <p className="text-xs text-slate-400">Losses</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-slate-900/50 border border-slate-800">
          <Gamepad2 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{profile.tournaments}</p>
          <p className="text-xs text-slate-400">Events</p>
        </div>
      </motion.div>

      {/* Tournament History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3">Riwayat Turnamen</h3>
        {profile.history && profile.history.length > 0 ? (
          <div className="space-y-2">
            {profile.history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      item.position === 1 && "bg-yellow-500/20",
                      item.position === 2 && "bg-slate-500/20"
                    )}>
                      <Crown className={cn(
                        "w-5 h-5",
                        item.position === 1 ? "text-yellow-400" : "text-slate-300"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.date}</p>
                    </div>
                  </div>
                  {item.prize && (
                    <p className="text-xs text-emerald-400">
                      +Rp {item.prize.toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">Belum ada riwayat</div>
        )}
      </motion.div>

      {/* Menu */}
      <div className="space-y-2">
        <button className="w-full p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-slate-400" />
            <span className="text-slate-300">Pengaturan</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        <button
          onClick={logout}
          className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400">Logout</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
