'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Trophy, Users, 
  Crown, Star, Heart, Building2, Gamepad2, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAppStore, useNavigationStore, divisionThemes } from '@/store';
import { SplashScreen } from '@/components/splash-screen';
import { DivisionTabs } from '@/components/division-tabs';
import { BottomNavigation } from '@/components/bottom-nav';
import { TournamentHeroCard } from '@/components/tournament-hero-card';
import { QuickStats } from '@/components/quick-stats';
import { PrizePool } from '@/components/prize-pool';
import { ParticipantsList } from '@/components/participants-list';
import { RulesSection } from '@/components/rules-section';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { InteractiveBracket } from '@/components/tournament/interactive-bracket';
import { ClubManagement } from '@/components/tournament/club-management';
import { DonationSaweranUI } from '@/components/tournament/donation-saweran-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ============================================
// TYPES - Extracted for better maintainability
// ============================================

interface TournamentData {
  id: string;
  name: string;
  status: string;
  bracketType: string;
}

interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'WALKOVER';
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
  winnerId?: string;
  homeTeam?: { id: string; name: string };
  awayTeam?: { id: string; name: string };
}

interface BracketData {
  id: string;
  rounds: number;
  matches: BracketMatch[];
}

interface TeamData {
  id: string;
  name: string;
}

interface RankingData {
  rank: number;
  id: string;
  name: string;
  avatar?: string | null;
  tier?: string | null;
  points: number;
}

interface ChampionData {
  tournament: { id: string; name: string; division: string; prizePool?: { totalAmount: number } | null };
  championTeam: { id: string; name: string; members: { user: { name: string | null } }[] } | null;
  mvp: { id: string; name: string | null } | null;
  finalizedAt: string;
}

interface ClubData {
  id: string;
  name: string;
  logo: string | null;
  totalPoints: number;
  _count?: { members: number };
}

interface TeamInfo {
  id: string;
  name: string;
  isGenerated: boolean;
  members: { user: { name: string | null; tier: string | null } }[];
  tournament?: { division: string };
}

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-3" />
      <h3 className="text-lg font-semibold text-white mb-2">Terjadi Kesalahan</h3>
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-slate-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

// ============================================
// MAIN HOME PAGE
// ============================================

export default function HomePage() {
  const { showSplash, activeDivision, setShowSplash, activeModal, closeModal, _hasHydrated } = useAppStore();
  const { activePage } = useNavigationStore();
  const theme = divisionThemes[activeDivision];
  
  const splashHandledRef = useRef(false);

  // Handle hydration and splash timing - always show splash screen
  useEffect(() => {
    if (_hasHydrated && !splashHandledRef.current) {
      splashHandledRef.current = true;
      setShowSplash(true);
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 4000); // 4 detik splash screen setiap masuk aplikasi
      return () => clearTimeout(timer);
    }
  }, [_hasHydrated, setShowSplash]);

  // Show loading during hydration
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-2xl font-bold text-white">IDM</span>
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (showSplash) {
    return (
      <div className="min-h-screen bg-slate-950">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-slate-950", theme.bgPattern)}>
      <div className="particles-bg" />
      <div className="relative z-10 min-h-screen flex flex-col">
        <DivisionTabs />
        <div className="flex-1">
          {activePage === 'home' && <HomeContent activeDivision={activeDivision} />}
          {activePage === 'rank' && <RankContent />}
          {activePage === 'champions' && <ChampionsContent />}
          {activePage === 'teams' && <TeamsContent />}
          {activePage === 'profile' && <ProfileContent />}
        </div>
        <BottomNavigation />
      </div>

      <Dialog open={activeModal === 'bracket'} onOpenChange={() => closeModal()}>
        <DialogContent className="bg-slate-900/95 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-hidden backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className={cn(
                "w-5 h-5",
                activeDivision === 'MALE' && "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]",
                activeDivision === 'FEMALE' && "text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]",
                activeDivision === 'LIGA' && "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              )} />
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent font-bold">
                Tournament Bracket
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            <BracketView />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// HOME CONTENT
// ============================================

function HomeContent({ activeDivision }: { activeDivision: string }) {
  const [showDonation, setShowDonation] = useState(false);
  const [donationTab, setDonationTab] = useState<'donation' | 'saweran'>('saweran');

  return (
    <div className="pb-24 overflow-y-auto">
      <TournamentHeroCard 
        key={`hero-${activeDivision}`} 
        onOpenDonation={() => {
          setDonationTab('saweran');
          setShowDonation(true);
        }} 
      />
      
      <div className="mx-4 mt-4">
        <DonationSaweranUI />
      </div>
      
      <div key={`overview-${activeDivision}`}>
        <QuickStats key={`stats-${activeDivision}`} />
        <PrizePool key={`prize-${activeDivision}`} />
        <ParticipantsList key={`participants-${activeDivision}`} />
        <RulesSection key={`rules-${activeDivision}`} />
      </div>

      <Dialog open={showDonation} onOpenChange={setShowDonation}>
        <DialogContent className="bg-slate-900/95 border-emerald-500/30 text-white max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent font-bold">
                Sawer Prize Pool
              </span>
            </DialogTitle>
          </DialogHeader>
          <DonationSaweranUI defaultTab={donationTab} onDonationComplete={() => setShowDonation(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// BRACKET VIEW - WITH ERROR HANDLING
// ============================================

function BracketView() {
  const { activeDivision, openModal } = useAppStore();
  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBracket = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tournamentRes = await fetch(`/api/tournaments?division=${activeDivision}&status=BRACKET_GENERATION,IN_PROGRESS`);
      
      if (!tournamentRes.ok) {
        throw new Error('Gagal memuat data turnamen');
      }
      
      const tournamentData = await tournamentRes.json();
      
      if (tournamentData.success && tournamentData.data?.length > 0) {
        const activeTournament = tournamentData.data[0];
        setTournament(activeTournament);

        const bracketRes = await fetch(`/api/brackets?tournamentId=${activeTournament.id}`);
        
        if (!bracketRes.ok) {
          throw new Error('Gagal memuat data bracket');
        }
        
        const bracketData = await bracketRes.json();

        if (bracketData.success && bracketData.data?.length > 0) {
          const bracketInfo = bracketData.data[0];
          setBracket(bracketInfo);
          
          const allTeams: TeamData[] = [];
          bracketInfo.matches?.forEach((m: {homeTeam?: TeamData; awayTeam?: TeamData}) => {
            if (m.homeTeam && !allTeams.find(t => t.id === m.homeTeam?.id)) {
              allTeams.push(m.homeTeam);
            }
            if (m.awayTeam && !allTeams.find(t => t.id === m.awayTeam?.id)) {
              allTeams.push(m.awayTeam);
            }
          });
          setTeams(allTeams);
        } else {
          setBracket(null);
          setTeams([]);
        }
      } else {
        setTournament(null);
        setBracket(null);
        setTeams([]);
      }
    } catch (err) {
      console.error('Error fetching bracket:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, [activeDivision]);

  useEffect(() => {
    fetchBracket();
  }, [fetchBracket]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchBracket} />;
  }

  if (!tournament || !bracket || !bracket.matches?.length) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">
          {tournament?.name || 'Belum Ada Bracket'}
        </h3>
        <p className="text-sm text-slate-400">
          {tournament ? 'Bracket sedang disiapkan' : `Bracket turnamen ${activeDivision === 'MALE' ? 'Male' : activeDivision === 'FEMALE' ? 'Female' : 'Liga IDM'} belum tersedia`}
        </p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <div className="mb-3 px-1">
        <h3 className="text-sm font-semibold text-white">{tournament.name}</h3>
        <p className="text-xs text-slate-400">
          {tournament.bracketType?.replace(/_/g, ' ')} • {teams.length} Tim
        </p>
      </div>
      <InteractiveBracket
        matches={bracket.matches}
        rounds={bracket.rounds}
        teams={teams}
        bracketType={tournament.bracketType || 'SINGLE_ELIMINATION'}
        onMatchClick={(match) => console.log('Match clicked:', match)}
      />
    </div>
  );
}

// ============================================
// RANK CONTENT - WITH ERROR HANDLING
// ============================================

function RankContent() {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rankings?type=players&limit=20');
      
      if (!res.ok) {
        throw new Error('Gagal memuat data ranking');
      }
      
      const data = await res.json();
      if (data.success) {
        setRankings(data.data || []);
      } else {
        throw new Error(data.error || 'Gagal memuat data');
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const getAvatar = (rank: number) => {
    const avatars = ['🎮', '👑', '🏆', '⚔️', '✨', '🔥', '💫', '🎯', '🚀', '💎'];
    return avatars[(rank - 1) % avatars.length];
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
        <span className="bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
          Global Ranking
        </span>
      </h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRankings} />
      ) : rankings.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Belum ada data ranking</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(player.rank * 0.05, 0.5) }}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                "bg-gradient-to-r from-slate-900/80 to-slate-800/50",
                "hover:scale-[1.02] active:scale-[0.98]",
                player.rank === 1 && "border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)]",
                player.rank === 2 && "border-slate-400/50 shadow-[0_0_15px_rgba(148,163,184,0.15)]",
                player.rank === 3 && "border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.15)]",
                player.rank > 3 && "border-slate-700/50 hover:border-slate-600/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg",
                player.rank === 1 && "bg-gradient-to-br from-yellow-400 to-amber-600 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]",
                player.rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-500 text-black shadow-[0_0_10px_rgba(148,163,184,0.4)]",
                player.rank === 3 && "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]",
                player.rank > 3 && "bg-slate-800 text-slate-400 border border-slate-700"
              )}>
                {player.rank}
              </div>
              <div className="text-2xl">{player.avatar || getAvatar(player.rank)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{player.name || 'Unknown'}</p>
                {player.tier && (
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    player.tier === 'S' && "border-yellow-500/50 text-yellow-400",
                    player.tier === 'A' && "border-cyan-500/50 text-cyan-400",
                    player.tier === 'B' && "border-slate-500/50 text-slate-400"
                  )}>
                    Tier {player.tier}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-cyan-400">{player.points}</p>
                <p className="text-xs text-slate-500">points</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// CHAMPIONS CONTENT - WITH ERROR HANDLING
// ============================================

function ChampionsContent() {
  const [champions, setChampions] = useState<ChampionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChampions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tournaments?status=COMPLETED');
      
      if (!res.ok) {
        throw new Error('Gagal memuat data champion');
      }
      
      const data = await res.json();
      if (data.success) {
        const completedTournaments = data.data.filter((t: { champion?: { championTeamId?: string } }) => t.champion);
        setChampions(completedTournaments.map((t: {
          id: string;
          name: string;
          division: string;
          prizePool?: { totalAmount: number };
          champion?: {
            championTeamId: string;
            runnerUpTeamId: string;
            finalizedAt: string;
          };
          teams?: { id: string; name: string; members: { user: { name: string | null } }[] }[];
        }) => {
          const championTeam = t.teams?.find((team: { id: string }) => team.id === t.champion?.championTeamId);
          return {
            tournament: { id: t.id, name: t.name, division: t.division, prizePool: t.prizePool },
            championTeam: championTeam || null,
            mvp: null,
            finalizedAt: t.champion?.finalizedAt || new Date().toISOString()
          };
        }));
      }
    } catch (err) {
      console.error('Error fetching champions:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChampions();
  }, [fetchChampions]);

  const formatPrize = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return 'Tanggal tidak valid';
    }
  };

  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]" />
        <span className="bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
          Hall of Champions
        </span>
      </h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchChampions} />
      ) : champions.length === 0 ? (
        <div className="text-center py-12">
          <Crown className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Belum ada turnamen yang selesai</p>
        </div>
      ) : (
        <div className="space-y-4">
          {champions.map((champ) => (
            <motion.div
              key={champ.tournament.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "p-5 rounded-2xl border transition-all duration-300",
                "bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900",
                champ.tournament.division === 'MALE' && "border-red-500/30",
                champ.tournament.division === 'FEMALE' && "border-purple-500/30",
                champ.tournament.division === 'LIGA' && "border-emerald-500/30"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge className={cn(
                    "mb-2",
                    champ.tournament.division === 'MALE' && "bg-red-500/20 text-red-400 border-red-500/30",
                    champ.tournament.division === 'FEMALE' && "bg-purple-500/20 text-purple-400 border-purple-500/30",
                    champ.tournament.division === 'LIGA' && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  )}>
                    {champ.tournament.division}
                  </Badge>
                  <h3 className="text-lg font-bold text-white">{champ.tournament.name}</h3>
                  <p className="text-xs text-slate-500">{formatDate(champ.finalizedAt)}</p>
                </div>
                <p className="text-lg font-bold text-emerald-400">
                  {champ.tournament.prizePool ? formatPrize(champ.tournament.prizePool.totalAmount) : 'Rp 0'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-yellow-400">Champion</span>
                  </div>
                  <p className="font-semibold text-white">{champ.championTeam?.name || 'TBD'}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-cyan-400">MVP</span>
                  </div>
                  <p className="font-semibold text-white">{champ.mvp?.name || 'TBD'}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// TEAMS CONTENT - WITH ERROR HANDLING
// ============================================

function TeamsContent() {
  const [showClubManagement, setShowClubManagement] = useState(false);
  const { activeDivision } = useAppStore();
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clubsRes, teamsRes] = await Promise.all([
        fetch('/api/clubs'),
        fetch('/api/teams')
      ]);
      
      if (!clubsRes.ok || !teamsRes.ok) {
        throw new Error('Gagal memuat data');
      }
      
      const [clubsData, teamsData] = await Promise.all([clubsRes.json(), teamsRes.json()]);
      if (clubsData.success) setClubs(clubsData.data || []);
      if (teamsData.success) setTeams(teamsData.data || []);
    } catch (err) {
      console.error('Error fetching teams data:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (showClubManagement) {
    return (
      <div className="p-4 pb-24">
        <Button 
          onClick={() => setShowClubManagement(false)} 
          variant="ghost" 
          className="text-slate-400 mb-4 hover:text-white"
          aria-label="Kembali"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Kembali</span>
        </Button>
        <ClubManagement />
      </div>
    );
  }

  const divisionTeams = teams.filter(t => t.tournament?.division === activeDivision);

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
          activeDivision === 'MALE' && "from-red-500/20 to-red-600/10 border border-red-500/30",
          activeDivision === 'FEMALE' && "from-purple-500/20 to-purple-600/10 border border-purple-500/30",
          activeDivision === 'LIGA' && "from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30"
        )}>
          <Gamepad2 className={cn(
            "w-5 h-5",
            activeDivision === 'MALE' && "text-red-400",
            activeDivision === 'FEMALE' && "text-purple-400",
            activeDivision === 'LIGA' && "text-emerald-400"
          )} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Kompetisi</h2>
          <p className="text-xs text-slate-400">Tim & Club</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <>
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-300">Club</h3>
              </div>
              <Button 
                size="sm" 
                onClick={() => setShowClubManagement(true)} 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-xs"
                aria-label="Kelola Club"
              >
                <Sparkles className="w-3 h-3 mr-1" /> Kelola
              </Button>
            </div>
            {clubs.length === 0 ? (
              <div className="text-center py-6 bg-slate-900/50 rounded-xl border border-slate-800">
                <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">Belum ada club terdaftar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clubs.map((club) => (
                  <div key={club.id} className="p-4 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-900/20 via-slate-900 to-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 flex items-center justify-center text-2xl border border-emerald-500/30">
                        {club.logo || '🏢'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{club.name}</p>
                        <p className="text-xs text-slate-400">{club._count?.members || 0} anggota • <span className="text-emerald-400 font-medium">{club.totalPoints.toLocaleString()} pts</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-300">Tim Turnamen</h3>
            </div>
            {divisionTeams.length === 0 ? (
              <div className="text-center py-6 bg-slate-900/50 rounded-xl border border-slate-800">
                <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-sm text-slate-500">Belum ada tim untuk divisi ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {divisionTeams.map((team) => (
                  <div key={team.id} className={cn(
                    "p-4 rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-800/50",
                    activeDivision === 'MALE' && "border-red-500/20",
                    activeDivision === 'FEMALE' && "border-purple-500/20",
                    activeDivision === 'LIGA' && "border-emerald-500/20"
                  )}>
                    <p className="font-semibold text-white">{team.name}</p>
                    {team.members && team.members.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {team.members.map((m, i) => (
                          <span key={i} className={cn(
                            "px-2 py-1 rounded-lg text-xs font-medium bg-slate-800/50 border",
                            m.user.tier === 'S' && "border-yellow-500/30 text-yellow-400",
                            m.user.tier === 'A' && "border-cyan-500/30 text-cyan-400",
                            m.user.tier === 'B' && "border-slate-500/30 text-slate-300"
                          )}>
                            {m.user.name || 'Unknown'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ============================================
// PROFILE CONTENT - WITH VALIDATION
// ============================================

function ProfileContent() {
  const { user, isAuthenticated, logout, setUser, activeDivision } = useAppStore();
  const [showAdmin, setShowAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Phone validation - Indonesian numbers can be 10-13 digits total
  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Accept: +628xxx, 628xxx, 08xxx (10-13 digits total)
    return /^(\+62|62|0)8\d{8,12}$/.test(cleanPhone);
  };

  const handleSendOtp = async () => {
    // Validate phone
    if (!phone) {
      setError('Nomor WhatsApp harus diisi');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Format nomor tidak valid (contoh: 08123456789)');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phone }) 
      });
      
      if (!res.ok) {
        throw new Error('Gagal mengirim OTP');
      }
      
      const data = await res.json();
      if (data.success) {
        setStep('verify');
        if (data.debug?.otp) setDebugOtp(data.debug.otp);
      } else {
        setError(data.error || 'Gagal mengirim OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { 
      setLoading(false); 
    }
  };

  const handleVerifyOtp = async () => {
    // Validate OTP
    if (!otp) {
      setError('Kode OTP harus diisi');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setError('Kode OTP harus 6 digit angka');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phone, otp }) 
      });
      
      if (!res.ok) {
        throw new Error('Gagal verifikasi OTP');
      }
      
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setShowLoginModal(false);
        setPhone(''); setOtp(''); setStep('phone'); setError(''); setDebugOtp('');
      } else {
        setError(data.error || 'OTP tidak valid');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { 
      setLoading(false); 
    }
  };

  const handleAdminLogin = async () => {
    // Validate inputs
    if (!phone || !password) {
      setError('Nomor dan password harus diisi');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Format nomor tidak valid');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phone, password }) 
      });
      
      if (!res.ok) {
        throw new Error('Login gagal');
      }
      
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setShowLoginModal(false);
        setPhone(''); setPassword(''); setError('');
      } else {
        setError(data.error || 'Login gagal');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally { 
      setLoading(false); 
    }
  };

  const resetLoginState = () => {
    setPhone('');
    setOtp('');
    setPassword('');
    setStep('phone');
    setError('');
    setDebugOtp('');
  };

  if (showAdmin && isAdmin) {
    return <AdminDashboardWrapper onBack={() => setShowAdmin(false)} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 pb-24 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
            <span className="text-4xl">👤</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Belum Login</h2>
          <p className="text-slate-400 text-sm mb-6">Login untuk mengakses profil lengkap</p>
          <Button 
            onClick={() => setShowLoginModal(true)} 
            className={cn(
              "px-8 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg",
              activeDivision === 'MALE' && "bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30",
              activeDivision === 'FEMALE' && "bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30",
              activeDivision === 'LIGA' && "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/30"
            )}
            aria-label="Login atau Daftar"
          >
            Login / Daftar
          </Button>
        </div>

        <Dialog open={showLoginModal} onOpenChange={(open) => {
          if (!open) resetLoginState();
          setShowLoginModal(open);
        }}>
          <DialogContent className="bg-slate-900/95 border-slate-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Login ke Idol Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {step === 'phone' ? (
                <>
                  <div>
                    <label htmlFor="phone" className="block text-xs text-slate-400 mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="08xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      aria-required="true"
                      aria-invalid={!!error}
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-xs text-slate-400 mb-1">
                      Password (khusus admin)
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Password admin"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="otp" className="block text-xs text-slate-400 mb-1">
                    Kode OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="Kode 6 digit"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-center text-2xl tracking-widest"
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                </div>
              )}
              
              {error && (
                <p className="text-red-400 text-sm text-center" role="alert">
                  {error}
                </p>
              )}
              
              {debugOtp && (
                <p className="text-yellow-400 text-xs text-center">
                  Debug OTP: {debugOtp}
                </p>
              )}
              
              <Button
                onClick={step === 'phone' ? (password ? handleAdminLogin : handleSendOtp) : handleVerifyOtp}
                disabled={loading}
                className={cn(
                  "w-full py-3 rounded-xl font-medium transition-all",
                  "bg-gradient-to-r from-red-500 to-red-600 text-white",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                {loading ? 'Memproses...' : step === 'phone' ? (password ? 'Login Admin' : 'Kirim OTP') : 'Verifikasi OTP'}
              </Button>
              
              {step === 'verify' && (
                <Button 
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); }} 
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white"
                >
                  Kembali
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700">
          <span className="text-3xl">👤</span>
        </div>
        <h2 className="text-xl font-bold text-white">{user?.name || 'User'}</h2>
        <p className="text-slate-400 text-sm">{user?.phone}</p>
        <Badge className="mt-2">{user?.role}</Badge>
      </div>

      {isAdmin && (
        <Button 
          onClick={() => setShowAdmin(true)} 
          className="w-full mb-4 bg-gradient-to-r from-red-500 to-red-600"
        >
          Buka Admin Dashboard
        </Button>
      )}

      <Button 
        onClick={() => { logout(); resetLoginState(); }} 
        variant="outline" 
        className="w-full border-slate-700 text-slate-300"
      >
        Logout
      </Button>
    </div>
  );
}

// ============================================
// ADMIN DASHBOARD WRAPPER
// ============================================

function AdminDashboardWrapper({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-4 pb-24">
      <Button 
        onClick={onBack} 
        variant="ghost" 
        className="text-slate-400 mb-4 hover:text-white"
        aria-label="Kembali ke Profil"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span>Kembali ke Profil</span>
      </Button>
      <AdminDashboard />
    </div>
  );
}
