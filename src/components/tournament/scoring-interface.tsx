'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, CheckCircle2, XCircle, Trophy, Medal, Star, Crown,
  RefreshCw, ChevronRight, Users, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  bracketSide?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  winnerId?: string;
  homeTeam?: { id: string; name: string; members?: { user: { name: string | null } }[] };
  awayTeam?: { id: string; name: string; members?: { user: { name: string | null } }[] };
}

interface ScoringInterfaceProps {
  tournamentId: string;
  matches: Match[];
  teams: { id: string; name: string }[];
  onScoreUpdate?: () => void;
}

export function ScoringInterface({ tournamentId, matches, teams, onScoreUpdate }: ScoringInterfaceProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const handleUpdateScore = async () => {
    if (!selectedMatch) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/matches/${selectedMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore, awayScore }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Skor berhasil diperbarui');
        setSelectedMatch(null);
        onScoreUpdate?.();
      } else {
        toast.error(data.error || 'Gagal memperbarui skor');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartMatch = async (matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Pertandingan dimulai');
        onScoreUpdate?.();
      }
    } catch (error) {
      toast.error('Gagal memulai pertandingan');
    }
  };

  const getRoundName = (round: number, totalRounds: number, bracketSide?: string) => {
    if (bracketSide === 'LOWER') return `Lower Round ${round}`;
    if (bracketSide === 'GRAND_FINAL') return 'Grand Final';
    
    const remaining = totalRounds - round + 1;
    if (remaining === 1) return 'Grand Final';
    if (remaining === 2) return 'Semi Final';
    if (remaining === 3) return 'Quarter Final';
    return `Round ${round}`;
  };

  const totalRounds = Math.max(...Object.keys(matchesByRound).map(Number));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Target className="w-5 h-5 text-cyan-400" />
        Scoring Interface
      </h3>

      {/* Matches by Round */}
      {Object.entries(matchesByRound).map(([round, roundMatches]) => (
        <div key={round} className="space-y-2">
          <h4 className="text-sm font-medium text-slate-400">
            {getRoundName(Number(round), totalRounds, roundMatches[0]?.bracketSide)}
          </h4>
          
          <div className="grid gap-2">
            {roundMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onSelect={() => {
                  setSelectedMatch(match);
                  setHomeScore(match.homeScore || 0);
                  setAwayScore(match.awayScore || 0);
                }}
                onStart={() => handleStartMatch(match.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Score Input Dialog */}
      <Dialog open={!!selectedMatch} onOpenChange={() => setSelectedMatch(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Input Skor</DialogTitle>
          </DialogHeader>
          
          {selectedMatch && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">
                    {selectedMatch.homeTeam?.name || 'TBD'}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    value={homeScore}
                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-center text-2xl font-bold"
                  />
                </div>
                <div className="text-center text-slate-500 font-bold">VS</div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-2">
                    {selectedMatch.awayTeam?.name || 'TBD'}
                  </p>
                  <Input
                    type="number"
                    min={0}
                    value={awayScore}
                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                    className="bg-slate-800 border-slate-700 text-center text-2xl font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpdateScore}
                  disabled={isUpdating}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Skor'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchCard({ match, onSelect, onStart }: { 
  match: Match; 
  onSelect: () => void;
  onStart: () => void;
}) {
  const statusColors: Record<string, string> = {
    SCHEDULED: 'bg-slate-600',
    IN_PROGRESS: 'bg-orange-500 animate-pulse',
    COMPLETED: 'bg-emerald-500',
    WALKOVER: 'bg-red-500',
  };

  const isCompleted = match.status === 'COMPLETED';
  const isInProgress = match.status === 'IN_PROGRESS';
  const canStart = match.status === 'SCHEDULED' && match.homeTeamId && match.awayTeamId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 rounded-lg border transition-all cursor-pointer",
        isCompleted && "bg-emerald-500/10 border-emerald-500/30",
        isInProgress && "bg-orange-500/10 border-orange-500/30",
        !isCompleted && !isInProgress && "bg-slate-900/50 border-slate-800 hover:border-slate-600"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500">Match #{match.matchNumber}</span>
        <Badge className={cn("text-xs", statusColors[match.status])}>
          {match.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={cn(
            "text-sm font-medium",
            isCompleted && match.winnerId === match.homeTeamId ? "text-emerald-400" : "text-slate-300"
          )}>
            {match.homeTeam?.name || 'TBD'}
          </p>
        </div>
        
        {isCompleted ? (
          <div className="flex items-center gap-2 px-3">
            <span className={cn(
              "font-bold",
              match.winnerId === match.homeTeamId ? "text-emerald-400" : "text-slate-400"
            )}>
              {match.homeScore}
            </span>
            <span className="text-slate-500">-</span>
            <span className={cn(
              "font-bold",
              match.winnerId === match.awayTeamId ? "text-emerald-400" : "text-slate-400"
            )}>
              {match.awayScore}
            </span>
          </div>
        ) : isInProgress ? (
          <Button size="sm" className="bg-orange-600 hover:bg-orange-500 mx-2" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            Input Skor
          </Button>
        ) : canStart ? (
          <Button size="sm" variant="outline" className="mx-2 border-cyan-500/30 text-cyan-400" onClick={(e) => { e.stopPropagation(); onStart(); }}>
            <Play className="w-3 h-3 mr-1" />
            Mulai
          </Button>
        ) : (
          <span className="text-slate-500 text-xs">Menunggu</span>
        )}
        
        <div className="flex-1 text-right">
          <p className={cn(
            "text-sm font-medium",
            isCompleted && match.winnerId === match.awayTeamId ? "text-emerald-400" : "text-slate-300"
          )}>
            {match.awayTeam?.name || 'TBD'}
          </p>
        </div>
      </div>

      {isCompleted && match.winnerId && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <p className="text-xs text-center text-emerald-400 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Winner: {match.winnerId === match.homeTeamId ? match.homeTeam?.name : match.awayTeam?.name}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// TOURNAMENT FINALIZATION COMPONENT
// ============================================

interface FinalizationInterfaceProps {
  tournamentId: string;
  teams: { id: string; name: string }[];
  participants: { id: string; name: string | null }[];
  onComplete: () => void;
}

export function FinalizationInterface({ tournamentId, teams, participants, onComplete }: FinalizationInterfaceProps) {
  const [championId, setChampionId] = useState('');
  const [runnerUpId, setRunnerUpId] = useState('');
  const [thirdPlaceId, setThirdPlaceId] = useState('');
  const [mvpId, setMvpId] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);

  const handleFinalize = async () => {
    if (!championId || !runnerUpId) {
      toast.error('Pilih Juara 1 dan Juara 2');
      return;
    }

    setIsFinalizing(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          championTeamId: championId,
          runnerUpTeamId: runnerUpId,
          thirdPlaceTeamId: thirdPlaceId || null,
          mvpId: mvpId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Turnamen berhasil diselesaikan!');
        onComplete();
      } else {
        toast.error(data.error || 'Gagal menyelesaikan turnamen');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-400" />
        Finalisasi Turnamen
      </h3>

      <div className="grid gap-4">
        {/* Champion */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border border-yellow-500/30">
          <Label className="flex items-center gap-2 text-yellow-400 mb-2">
            <Trophy className="w-4 h-4" />
            Juara 1
          </Label>
          <Select value={championId} onValueChange={setChampionId}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Pilih tim juara 1" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Runner Up */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-500/20 to-slate-400/10 border border-slate-500/30">
          <Label className="flex items-center gap-2 text-slate-300 mb-2">
            <Medal className="w-4 h-4" />
            Juara 2
          </Label>
          <Select value={runnerUpId} onValueChange={setRunnerUpId}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Pilih tim juara 2" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {teams.filter(t => t.id !== championId).map((team) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Third Place */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-600/20 to-orange-500/10 border border-amber-600/30">
          <Label className="flex items-center gap-2 text-amber-400 mb-2">
            <Medal className="w-4 h-4" />
            Juara 3 (Opsional)
          </Label>
          <Select value={thirdPlaceId} onValueChange={setThirdPlaceId}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Pilih tim juara 3" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {teams.filter(t => t.id !== championId && t.id !== runnerUpId).map((team) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* MVP */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border border-cyan-500/30">
          <Label className="flex items-center gap-2 text-cyan-400 mb-2">
            <Star className="w-4 h-4" />
            MVP (Opsional)
          </Label>
          <Select value={mvpId} onValueChange={setMvpId}>
            <SelectTrigger className="bg-slate-800 border-slate-700">
              <SelectValue placeholder="Pilih MVP" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {participants.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name || 'Unknown'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleFinalize}
        disabled={isFinalizing || !championId || !runnerUpId}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-bold"
      >
        {isFinalizing ? 'Memproses...' : 'Selesaikan Turnamen'}
      </Button>
    </div>
  );
}
