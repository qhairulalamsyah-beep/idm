'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Calendar, MapPin, Users, Zap, Heart, Trophy, RefreshCw, Music, Gamepad2, AlertCircle, Sparkles } from 'lucide-react';
import { useAppStore, divisionThemes, Division } from '@/store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RegistrationModal } from '@/components/tournament/registration-modal';

// ============================================
// TYPES
// ============================================

interface TournamentData {
  id: string;
  name: string;
  mode: string;
  bpm: string;
  bracketType: string;
  status: string;
  maxParticipants: number;
  currentParticipants: number;
  pendingCount?: number;
  approvedCount?: number;
  actualParticipants?: number;
  startDate: string;
  location: string;
  prizePool?: {
    championAmount: number;
    runnerUpAmount: number;
    thirdPlaceAmount: number;
    mvpAmount: number;
    totalAmount: number;
  };
  registrations?: Array<{
    id: string;
    status: string;
    user: {
      id: string;
      name: string | null;
      tier: string | null;
    };
  }>;
}

interface TournamentHeroCardProps {
  onOpenDonation?: () => void;
  onOpenBracket?: () => void;
}

// ============================================
// CONSTANTS - Moved outside component to prevent recreation
// ============================================

const STATUS_COLORS: Record<string, string> = {
  SETUP: 'bg-slate-500',
  REGISTRATION: 'bg-green-500',
  APPROVAL: 'bg-yellow-500',
  TEAM_GENERATION: 'bg-blue-500',
  BRACKET_GENERATION: 'bg-purple-500',
  IN_PROGRESS: 'bg-orange-500 animate-pulse',
  FINALIZATION: 'bg-cyan-500',
  COMPLETED: 'bg-emerald-500',
};

const STATUS_LABELS: Record<string, string> = {
  SETUP: 'Menyiapkan',
  REGISTRATION: 'Pendaftaran Dibuka',
  APPROVAL: 'Proses Approval',
  TEAM_GENERATION: 'Generate Tim',
  BRACKET_GENERATION: 'Generate Bracket',
  IN_PROGRESS: 'Sedang Berlangsung',
  FINALIZATION: 'Finalisasi',
  COMPLETED: 'Selesai',
};

const ACCENT_BUTTONS: Record<Division, string> = {
  MALE: 'from-red-500 to-red-700 hover:from-red-400 hover:to-red-600',
  FEMALE: 'from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500',
};

// ============================================
// ERROR STATE COMPONENT
// ============================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">Gagal Memuat Data</h3>
      <p className="text-sm text-slate-400 mb-4">
        Terjadi kesalahan saat memuat data turnamen.
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-slate-700 text-slate-400"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Coba Lagi
      </Button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TournamentHeroCard({ onOpenDonation, onOpenBracket }: TournamentHeroCardProps) {
  const { activeDivision, openModal } = useAppStore();
  const theme = divisionThemes[activeDivision];
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchTournament = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/tournaments?division=${activeDivision}&status=REGISTRATION,APPROVAL,TEAM_GENERATION,BRACKET_GENERATION,IN_PROGRESS`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch tournament');
      }
      
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setTournament(data.data[0]);
      } else {
        setTournament(null);
      }
    } catch (error) {
      console.error('Error fetching tournament:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [activeDivision]);

  useEffect(() => {
    fetchTournament();
  }, [activeDivision, refreshKey, fetchTournament]);

  // Handle "Live Now!" button click - open bracket modal
  const handleLiveNowClick = () => {
    if (onOpenBracket) {
      onOpenBracket();
    } else {
      openModal('bracket');
    }
  };

  // Calculate progress with guard against division by zero
  const maxParticipants = tournament?.maxParticipants || 1;
  const currentParticipants = tournament?.approvedCount || tournament?.actualParticipants || 0;
  const progressPercentage = Math.max(0, Math.min(100, (currentParticipants / maxParticipants) * 100));

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl border mx-4 mt-4 p-5",
        "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
        theme.cardBorder
      )}>
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-slate-700 rounded" />
            <div className="h-5 w-24 bg-slate-700 rounded" />
          </div>
          <div className="h-7 w-48 bg-slate-700 rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-5 w-32 bg-slate-700 rounded" />
            <div className="h-5 w-28 bg-slate-700 rounded" />
          </div>
          <div className="h-2 w-full bg-slate-700 rounded-full" />
          <div className="flex gap-3">
            <div className="h-10 flex-1 bg-slate-700 rounded-lg" />
            <div className="h-10 w-24 bg-slate-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <motion.div
        key={activeDivision}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border mx-4 mt-4 p-5",
          "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
          theme.cardBorder
        )}
      >
        <ErrorState onRetry={() => setRefreshKey(k => k + 1)} />
      </motion.div>
    );
  }

  // No active tournament
  if (!tournament) {
    return (
      <motion.div
        key={activeDivision}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border mx-4 mt-4 p-5",
          "bg-gradient-to-br from-slate-900/90 to-slate-800/50",
          theme.cardBorder
        )}
      >
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Belum Ada Turnamen Aktif</h3>
          <p className="text-sm text-slate-400 mb-4">
            Turnamen {theme.name} akan segera hadir. Stay tuned!
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey(k => k + 1)}
            className="border-slate-700 text-slate-400"
            aria-label="Refresh data turnamen"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        key={`${activeDivision}-${tournament.id}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          "relative overflow-hidden rounded-2xl border mx-4 mt-4",
          "bg-gradient-to-br",
          theme.gradient,
          theme.cardBorder,
          "shine-effect"
        )}
        style={{
          boxShadow: `0 0 30px ${theme.neonColor}20`,
        }}
      >
        {/* Light sweep effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${theme.neonColor}20 45%, ${theme.neonColor}40 50%, ${theme.neonColor}20 55%, transparent 60%)`,
            width: '30%'
          }}
          animate={{ x: ['-400%', '400%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
        />
        
        {/* Cyber grid overlay */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(${theme.neonColor}40 1px, transparent 1px), linear-gradient(90deg, ${theme.neonColor}40 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
        {/* Neon border effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-50"
          style={{
            background: `linear-gradient(135deg, ${theme.neonColor}10, transparent, ${theme.neonColor}10)`,
          }}
        />

        {/* Animated corner accents */}
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute top-0 left-0 w-20 h-20"
          style={{
            background: `radial-gradient(circle at top left, ${theme.neonColor}40, transparent 70%)`,
          }}
        />
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 right-0 w-20 h-20"
          style={{
            background: `radial-gradient(circle at bottom right, ${theme.neonColor}40, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative p-5 z-20">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-start justify-between mb-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-medium border-current",
                    theme.textPrimary
                  )}
                >
                  {theme.icon} {theme.name}
                </Badge>
                <Badge 
                  className={cn(
                    "text-xs font-medium",
                    STATUS_COLORS[tournament.status] || 'bg-slate-500'
                  )}
                >
                  {STATUS_LABELS[tournament.status] || tournament.status.replace('_', ' ')}
                </Badge>
              </div>
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white"
                style={{ textShadow: `0 0 20px ${theme.neonColor}40` }}
              >
                {tournament.name}
              </motion.h2>
            </div>
          </motion.div>

          {/* Info Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 mb-4"
          >
            <div className="flex items-center gap-2 text-sm">
              <Gamepad2 className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-300">{tournament.mode || 'GR Arena 3vs3'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Music className="w-4 h-4 text-pink-400" />
              <span className="text-slate-300">{tournament.bpm || 'Random 120-140'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300">
                {new Date(tournament.startDate).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-red-400" />
              <span className="text-slate-300 truncate" title={tournament.location || 'Online'}>{tournament.location || 'Online'}</span>
            </div>
          </motion.div>

          {/* Slot Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Peserta Disetujui</span>
              </div>
              <span className="text-sm font-medium text-white">
                {currentParticipants}/{maxParticipants}
              </span>
            </div>
            <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                  "h-full rounded-full",
                  activeDivision === 'MALE' && "bg-gradient-to-r from-red-500 to-red-400",
                  activeDivision === 'FEMALE' && "bg-gradient-to-r from-purple-500 to-pink-400"
                )}
                style={{
                  boxShadow: `0 0 10px ${theme.neonColor}60`,
                }}
              />
            </div>
            {/* Pending badge */}
            {(tournament.pendingCount || 0) > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                  {tournament.pendingCount} menunggu approval
                </Badge>
              </div>
            )}
          </motion.div>

          {/* Bracket Type */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-4"
          >
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              📊 {tournament.bracketType?.replace(/_/g, ' ') || 'Single Elimination'}
            </Badge>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            {tournament.status === 'REGISTRATION' && (
              <Button
                onClick={() => setShowRegistration(true)}
                className={cn(
                  "flex-1 bg-gradient-to-r text-white font-semibold",
                  "transition-all duration-200 transform hover:scale-[1.02]",
                  "active:scale-[0.98]",
                  ACCENT_BUTTONS[activeDivision]
                )}
                style={{
                  boxShadow: `0 0 15px ${theme.neonColor}40`,
                }}
                aria-label="Daftar turnamen"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Daftar
              </Button>
            )}
            {tournament.status === 'IN_PROGRESS' && (
              <Button
                onClick={handleLiveNowClick}
                className={cn(
                  "flex-1 bg-gradient-to-r text-white font-semibold",
                  "from-orange-500 to-red-500",
                  "transition-all duration-200 transform hover:scale-[1.02]",
                  "active:scale-[0.98]"
                )}
                aria-label="Lihat bracket turnamen live"
              >
                <Zap className="w-4 h-4 mr-2" />
                Live Now!
              </Button>
            )}
            {tournament.status !== 'REGISTRATION' && tournament.status !== 'IN_PROGRESS' && (
              <Button
                variant="outline"
                disabled
                className="flex-1 border-slate-700 text-slate-500"
                aria-label="Pendaftaran ditutup"
              >
                Pendaftaran Ditutup
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenDonation?.()}
              className={cn(
                "border-pink-500/50 text-pink-400 hover:bg-pink-500/10",
                "transition-all duration-200"
              )}
              aria-label="Sawer prize pool"
            >
              <Heart className="w-4 h-4 mr-2" />
              Sawer
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Registration Modal */}
      {tournament && (
        <RegistrationModal
          isOpen={showRegistration}
          onClose={() => setShowRegistration(false)}
          tournamentId={tournament.id}
          tournamentName={tournament.name}
          division={activeDivision}
          onSuccess={() => {
            setRefreshKey(k => k + 1);
          }}
        />
      )}
    </>
  );
}
