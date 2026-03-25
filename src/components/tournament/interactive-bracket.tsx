'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Trophy, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Team {
  id: string;
  name: string;
  seed?: number;
  logo?: string;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  bracketSide?: 'UPPER' | 'LOWER' | 'GRAND_FINAL';
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'WALKOVER';
  winnerId?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  scheduledAt?: string;
}

interface InteractiveBracketProps {
  matches: Match[];
  rounds: number;
  teams: Team[];
  onMatchClick?: (match: Match) => void;
  showControls?: boolean;
  bracketType?: string;
}

export function InteractiveBracket({
  matches,
  rounds,
  teams,
  onMatchClick,
  showControls = true,
  bracketType = 'SINGLE_ELIMINATION',
}: InteractiveBracketProps) {
  const [zoom, setZoom] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [activeView, setActiveView] = useState<'UPPER' | 'LOWER' | 'GRAND_FINAL'>('UPPER');

  // Group matches by round and side
  const matchesByRound = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    
    matches.forEach((match) => {
      const key = match.bracketSide 
        ? `${match.bracketSide}-${match.round}`
        : `${match.round}`;
      
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(match);
    });
    
    return grouped;
  }, [matches]);

  // Get unique rounds
  const roundNumbers = useMemo(() => {
    return Array.from({ length: rounds }, (_, i) => i + 1);
  }, [rounds]);

  // Get unique bracket sides (for double elimination)
  const bracketSides = useMemo(() => {
    const sides = new Set(matches.map(m => m.bracketSide).filter(Boolean));
    return Array.from(sides) as ('UPPER' | 'LOWER' | 'GRAND_FINAL')[];
  }, [matches]);

  const getRoundName = (round: number, totalRounds: number, side?: string) => {
    if (side === 'LOWER') return `Lower Round ${round}`;
    if (side === 'GRAND_FINAL') return 'Grand Final';
    
    const remaining = totalRounds - round + 1;
    if (remaining === 1) return 'Final';
    if (remaining === 2) return 'Semi Final';
    if (remaining === 3) return 'Quarter Final';
    return `Round ${round}`;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  const handleMatchClick = (match: Match) => {
    setSelectedMatch(match);
    onMatchClick?.(match);
  };

  // Filter matches for current view
  const filteredMatches = (round: number) => {
    const key = bracketType === 'DOUBLE_ELIMINATION'
      ? `${activeView}-${round}`
      : `${round}`;
    return matchesByRound[key] || matchesByRound[`${round}`] || [];
  };

  return (
    <div className="relative w-full">
      {/* Controls */}
      {showControls && (
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {bracketType === 'DOUBLE_ELIMINATION' && (
                <div className="flex gap-1 mr-4">
                  {bracketSides.includes('UPPER') && (
                    <Button
                      variant={activeView === 'UPPER' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('UPPER')}
                      className="text-xs"
                    >
                      Upper
                    </Button>
                  )}
                  {bracketSides.includes('LOWER') && (
                    <Button
                      variant={activeView === 'LOWER' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('LOWER')}
                      className="text-xs"
                    >
                      Lower
                    </Button>
                  )}
                  {bracketSides.includes('GRAND_FINAL') && (
                    <Button
                      variant={activeView === 'GRAND_FINAL' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView('GRAND_FINAL')}
                      className="text-xs"
                    >
                      Final
                    </Button>
                  )}
                </div>
              )}
              <span className="text-xs text-slate-400">Bracket</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 w-7 p-0">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Container */}
      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div 
          className="flex gap-6 p-4 min-w-max transition-transform origin-top-left"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Render rounds */}
          {roundNumbers.map((round) => {
            const roundMatches = filteredMatches(round);
            if (roundMatches.length === 0) return null;

            return (
              <div key={round} className="flex flex-col min-w-[280px]">
                {/* Round Header */}
                <div className="sticky top-0 bg-slate-800/90 backdrop-blur rounded-lg px-4 py-2 mb-4 text-center">
                  <span className="text-sm font-semibold text-slate-300">
                    {getRoundName(round, rounds, activeView !== 'UPPER' ? activeView : undefined)}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    ({roundMatches.length} matches)
                  </span>
                </div>

                {/* Matches in this round */}
                <div className="flex flex-col gap-4 justify-around flex-1">
                  {roundMatches.map((match, index) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MatchCard
                        match={match}
                        onClick={() => handleMatchClick(match)}
                        isSelected={selectedMatch?.id === match.id}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Champion Slot (for single elimination) */}
          {bracketType === 'SINGLE_ELIMINATION' && (
            <div className="flex flex-col items-center justify-center min-w-[160px]">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-800 px-3 py-1 rounded-full">
                  <span className="text-xs font-semibold text-yellow-400">Champion</span>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Match Detail Modal */}
      <AnimatePresence>
        {selectedMatch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedMatch(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Match Card Component
function MatchCard({ 
  match, 
  onClick, 
  isSelected 
}: { 
  match: Match; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const isCompleted = match.status === 'COMPLETED';
  const isInProgress = match.status === 'IN_PROGRESS';
  const homeWon = match.winnerId === match.homeTeamId;
  const awayWon = match.winnerId === match.awayTeamId;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "rounded-xl border overflow-hidden cursor-pointer transition-all",
        isCompleted && "border-emerald-500/30 bg-emerald-500/5",
        isInProgress && "border-orange-500/50 bg-orange-500/10 ring-2 ring-orange-500/30",
        !isCompleted && !isInProgress && "border-slate-700 bg-slate-900/80 hover:border-slate-600",
        isSelected && "ring-2 ring-cyan-500"
      )}
    >
      {/* Match Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-[10px] text-slate-500">Match #{match.matchNumber}</span>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[10px] h-5",
            match.status === 'COMPLETED' && "border-emerald-500/50 text-emerald-400",
            match.status === 'IN_PROGRESS' && "border-orange-500/50 text-orange-400 bg-orange-500/10",
            match.status === 'SCHEDULED' && "border-slate-600 text-slate-400"
          )}
        >
          {match.status === 'IN_PROGRESS' && (
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1 animate-pulse" />
          )}
          {match.status}
        </Badge>
      </div>

      {/* Teams */}
      <div className="p-2">
        {/* Home Team */}
        <div
          className={cn(
            "flex items-center justify-between p-2 rounded-lg mb-1 transition-colors",
            homeWon && "bg-emerald-500/10",
            !isCompleted && "hover:bg-slate-800/50"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {match.homeTeam?.seed && (
              <span className="text-[10px] text-slate-500 w-4">{match.homeTeam.seed}</span>
            )}
            <span className={cn(
              "text-sm font-medium truncate",
              homeWon ? "text-emerald-400" : "text-slate-300",
              !match.homeTeam && "text-slate-500 italic"
            )}>
              {match.homeTeam?.name || 'TBD'}
            </span>
          </div>
          {isCompleted && (
            <span className={cn(
              "text-sm font-bold ml-2 tabular-nums",
              homeWon ? "text-emerald-400" : "text-slate-500"
            )}>
              {match.homeScore ?? '-'}
            </span>
          )}
          {isInProgress && (
            <span className="text-sm font-bold text-orange-400 ml-2 tabular-nums">
              {match.homeScore ?? 0}
            </span>
          )}
          {homeWon && (
            <Trophy className="w-3 h-3 text-yellow-400 ml-1 flex-shrink-0" />
          )}
        </div>

        {/* VS Divider */}
        <div className="flex items-center justify-center py-0.5">
          <div className="h-px flex-1 bg-slate-700/50" />
          <span className="px-2 text-[10px] text-slate-600 font-medium">VS</span>
          <div className="h-px flex-1 bg-slate-700/50" />
        </div>

        {/* Away Team */}
        <div
          className={cn(
            "flex items-center justify-between p-2 rounded-lg mt-1 transition-colors",
            awayWon && "bg-emerald-500/10",
            !isCompleted && "hover:bg-slate-800/50"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {match.awayTeam?.seed && (
              <span className="text-[10px] text-slate-500 w-4">{match.awayTeam.seed}</span>
            )}
            <span className={cn(
              "text-sm font-medium truncate",
              awayWon ? "text-emerald-400" : "text-slate-300",
              !match.awayTeam && "text-slate-500 italic"
            )}>
              {match.awayTeam?.name || 'TBD'}
            </span>
          </div>
          {isCompleted && (
            <span className={cn(
              "text-sm font-bold ml-2 tabular-nums",
              awayWon ? "text-emerald-400" : "text-slate-500"
            )}>
              {match.awayScore ?? '-'}
            </span>
          )}
          {isInProgress && (
            <span className="text-sm font-bold text-orange-400 ml-2 tabular-nums">
              {match.awayScore ?? 0}
            </span>
          )}
          {awayWon && (
            <Trophy className="w-3 h-3 text-yellow-400 ml-1 flex-shrink-0" />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Match Detail Modal
function MatchDetailModal({ match, onClose }: { match: Match; onClose: () => void }) {
  const isCompleted = match.status === 'COMPLETED';
  const isInProgress = match.status === 'IN_PROGRESS';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Match Details</h3>
        <Badge className={cn(
          isCompleted && "bg-emerald-500",
          isInProgress && "bg-orange-500",
          !isCompleted && !isInProgress && "bg-slate-600"
        )}>
          {match.status}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Teams */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-white truncate">{match.homeTeam?.name || 'TBD'}</p>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-slate-400">
              {isCompleted || isInProgress ? `${match.homeScore} - ${match.awayScore}` : 'VS'}
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-white truncate">{match.awayTeam?.name || 'TBD'}</p>
          </div>
        </div>

        {/* Winner */}
        {isCompleted && match.winnerId && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-sm text-emerald-400">
              Winner: {match.winnerId === match.homeTeamId ? match.homeTeam?.name : match.awayTeam?.name}
            </p>
          </div>
        )}

        {/* Scheduled Time */}
        {match.scheduledAt && (
          <div className="text-sm text-slate-400 text-center">
            Scheduled: {new Date(match.scheduledAt).toLocaleString()}
          </div>
        )}

        {/* Close Button */}
        <Button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600">
          Close
        </Button>
      </div>
    </div>
  );
}
