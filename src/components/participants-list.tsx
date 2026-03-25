'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronRight, Crown, RefreshCw, Clock } from 'lucide-react';
import { useAppStore, Division, divisionThemes } from '@/store';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Participant {
  id: string;
  name: string;
  tier: 'S' | 'A' | 'B' | null;
  status: string;
}

const tierColors = {
  S: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  A: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  B: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
};

const tierOrder = { S: 0, A: 1, B: 2 };

export function ParticipantsList() {
  const { activeDivision } = useAppStore();
  const theme = divisionThemes[activeDivision];
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active tournament for this division (REGISTRATION, APPROVAL, IN_PROGRESS, etc)
      const res = await fetch(`/api/tournaments?division=${activeDivision}&status=REGISTRATION,APPROVAL,TEAM_GENERATION,BRACKET_GENERATION,IN_PROGRESS`);
      const data = await res.json();
      
      if (data.success && data.data && data.data.length > 0) {
        const tournament = data.data[0];
        
        if (tournament.registrations && tournament.registrations.length > 0) {
          // Count pending registrations
          const pending = tournament.registrations.filter((reg: { status: string }) => reg.status === 'PENDING').length;
          setPendingCount(pending);
          
          // Filter approved registrations and sort by tier
          const approvedRegs = tournament.registrations
            .filter((reg: { status: string }) => reg.status === 'APPROVED')
            .map((reg: { id: string; tier?: string; displayTier?: string; status: string; user: { id: string; name: string | null; tier: string | null } }) => ({
              id: reg.id,
              name: reg.user.name || 'Unknown',
              // Use displayTier from API (registration tier takes priority), then user tier, then null
              tier: (reg.displayTier || reg.tier || reg.user.tier) as 'S' | 'A' | 'B' | null,
              status: reg.status,
            }))
            .sort((a: Participant, b: Participant) => {
              if (!a.tier) return 1;
              if (!b.tier) return -1;
              return tierOrder[a.tier] - tierOrder[b.tier];
            });
          

          setParticipants(approvedRegs);
          setTotalParticipants(approvedRegs.length);
        } else {
          setParticipants([]);
          setTotalParticipants(0);
          setPendingCount(0);
        }
      } else {
        setParticipants([]);
        setTotalParticipants(0);
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
      setTotalParticipants(0);
      setPendingCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeDivision]);

  useEffect(() => {
    fetchParticipants();
    
    // Refresh every 30 seconds to catch updates from admin approval
    const interval = setInterval(fetchParticipants, 30000);
    
    // Also listen for visibility changes to refresh when user returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchParticipants();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeDivision, fetchParticipants]);

  const [showAll, setShowAll] = useState(false);
  const displayParticipants = showAll ? participants : participants.slice(0, 5);
  const remainingCount = participants.length - 5;

  const divisionColors = {
    MALE: { text: 'text-red-400', bg: 'bg-red-500/20' },
    FEMALE: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Peserta Terdaftar
          </h3>
        </div>
        <div className="rounded-xl border p-3 bg-slate-900/50 border-slate-700">
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700" />
                  <div className="h-4 w-24 bg-slate-700 rounded" />
                </div>
                <div className="h-5 w-12 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // No participants but has pending
  if (participants.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 px-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Peserta Terdaftar
          </h3>
        </div>
        <div 
          className={cn(
            "rounded-xl border p-6 text-center",
            "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
            theme.cardBorder
          )}
        >
          <Users className="w-10 h-10 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada peserta terdaftar</p>
          <p className="text-slate-500 text-xs mt-1">Jadilah peserta pertama!</p>
        </div>
        {/* Pending indicator when no approved participants */}
        {pendingCount > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-400">{pendingCount} pendaftaran menunggu approval</span>
          </div>
        )}
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
          <Users className="w-4 h-4" />
          Peserta Terdaftar
          <span className="text-xs text-slate-500">({totalParticipants})</span>
        </h3>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400 bg-yellow-500/10">
              <Clock className="w-3 h-3 mr-1" />
              {pendingCount} pending
            </Badge>
          )}
          {remainingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-slate-400 hover:text-white h-7 px-2"
              aria-label={showAll ? 'Tampilkan lebih sedikit' : 'Lihat semua peserta'}
            >
              {showAll ? 'Tampilkan Lebih Sedikit' : 'Lihat Semua'}
              <ChevronRight className={cn("w-3 h-3 ml-1 transition-transform", showAll && "rotate-90")} />
            </Button>
          )}
        </div>
      </div>

      <div 
        className={cn(
          "rounded-xl border p-3",
          "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
          theme.cardBorder
        )}
      >
        <AnimatePresence mode="popLayout">
          {displayParticipants.map((participant, index) => {
            const tier = participant.tier || 'B';
            const tierStyle = tierColors[tier];
            return (
              <motion.div
                key={participant.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center justify-between py-2",
                  index !== displayParticipants.length - 1 && "border-b border-slate-800/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8 bg-slate-800">
                      <AvatarFallback className="text-xs bg-slate-700 text-white">
                        {participant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-400" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    {participant.name}
                  </span>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded text-xs font-bold",
                    tierStyle.bg,
                    tierStyle.text
                  )}
                >
                  Tier {tier}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {remainingCount > 0 && (
          <div className="flex items-center justify-center pt-3 border-t border-slate-800/50 mt-2">
            <span className="text-xs text-slate-500">
              +{remainingCount} peserta lainnya
            </span>
          </div>
        )}
        
        {/* Pending indicator at bottom */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-center pt-3 border-t border-slate-800/50 mt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-yellow-400 font-medium">
                {pendingCount} pendaftaran menunggu approval admin
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
