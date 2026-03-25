'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  winnerId?: string;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
}

interface BracketViewProps {
  matches: Match[];
  rounds: number;
}

export function BracketView({ matches, rounds }: BracketViewProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Group matches by round
  const matchesByRound: Record<number, Match[]> = {};
  matches.forEach((match) => {
    if (!matchesByRound[match.round]) {
      matchesByRound[match.round] = [];
    }
    matchesByRound[match.round].push(match);
  });

  const getRoundName = (round: number, totalRounds: number) => {
    const remaining = totalRounds - round + 1;
    if (remaining === 1) return 'Grand Final';
    if (remaining === 2) return 'Semi Final';
    if (remaining === 3) return 'Quarter Final';
    return `Round ${round}`;
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur p-2 flex items-center justify-between border-b border-slate-800">
        <span className="text-xs text-slate-400">Bracket</span>
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

      {/* Bracket Container */}
      <div 
        className="overflow-x-auto pb-4"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        <div className="flex gap-4 p-4 min-w-max">
          {Array.from({ length: rounds }, (_, i) => i + 1).map((round) => (
            <div key={round} className="flex flex-col gap-4 min-w-[200px]">
              {/* Round Header */}
              <div className="text-center text-xs font-semibold text-slate-400 py-2 bg-slate-800 rounded-lg">
                {getRoundName(round, rounds)}
              </div>

              {/* Matches */}
              <div className="flex flex-col gap-4 justify-around flex-1">
                {matchesByRound[round]?.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isCompleted = match.status === 'COMPLETED';
  const homeWon = match.winnerId === match.homeTeamId;
  const awayWon = match.winnerId === match.awayTeamId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border overflow-hidden",
        isCompleted ? "border-cyan-500/30 bg-cyan-500/5" : "border-slate-700 bg-slate-900/50"
      )}
    >
      {/* Home Team */}
      <div
        className={cn(
          "flex items-center justify-between p-2 border-b border-slate-700/50",
          homeWon && "bg-cyan-500/10"
        )}
      >
        <span className={cn(
          "text-sm font-medium truncate",
          homeWon ? "text-cyan-400" : "text-slate-300"
        )}>
          {match.homeTeam?.name || 'TBD'}
        </span>
        {isCompleted && (
          <span className={cn(
            "text-sm font-bold ml-2",
            homeWon ? "text-cyan-400" : "text-slate-500"
          )}>
            {match.homeScore}
          </span>
        )}
      </div>

      {/* Away Team */}
      <div
        className={cn(
          "flex items-center justify-between p-2",
          awayWon && "bg-cyan-500/10"
        )}
      >
        <span className={cn(
          "text-sm font-medium truncate",
          awayWon ? "text-cyan-400" : "text-slate-300"
        )}>
          {match.awayTeam?.name || 'TBD'}
        </span>
        {isCompleted && (
          <span className={cn(
            "text-sm font-bold ml-2",
            awayWon ? "text-cyan-400" : "text-slate-500"
          )}>
            {match.awayScore}
          </span>
        )}
      </div>

      {/* Match Status */}
      {match.status === 'IN_PROGRESS' && (
        <div className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs text-center">
          LIVE
        </div>
      )}
    </motion.div>
  );
}
