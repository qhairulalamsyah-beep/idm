'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Medal, Star, Crown, Target, TrendingUp, 
  Calendar, Users, Shield, Zap, Award, ChevronRight,
  Crown as ClubIcon, Gamepad2, Flame, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PlayerStats {
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentsRunnerUp: number;
  tournamentsThirdPlace: number;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  mvpCount: number;
  currentWinStreak: number;
  longestWinStreak: number;
  totalPrizeMoney: number;
  rating: number;
}

interface Achievement {
  id: string;
  achievement: {
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    points: number;
  };
  earnedAt: string;
  isDisplayed: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  tier: string;
  points: number;
  bio?: string;
  playerStats?: PlayerStats;
  achievements?: Achievement[];
  globalRank?: { rank: number };
  clubs?: Array<{
    club: { id: string; name: string; logo?: string };
    role: string;
  }>;
}

interface PlayerProfileProps {
  userId: string;
  onClose?: () => void;
}

export function PlayerProfile({ userId, onClose }: PlayerProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements' | 'history'>('stats');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/players/stats?userId=${userId}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Profile not found</p>
      </div>
    );
  }

  const stats = profile.playerStats;
  const winRate = stats && stats.matchesWon + stats.matchesLost > 0
    ? Math.round((stats.matchesWon / (stats.matchesWon + stats.matchesLost)) * 100)
    : 0;

  const getTierBadge = (tier: string) => {
    const styles = {
      S: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]',
      A: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]',
      B: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white',
    };
    return styles[tier as keyof typeof styles] || styles.B;
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-950 p-6 pb-24 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.1),transparent_50%)]" />
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50"
          >
            <ChevronRight className="w-5 h-5 text-white rotate-180" />
          </button>
        )}

        {/* Profile info */}
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/20">
              {profile.avatar || '👤'}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold",
              getTierBadge(profile.tier)
            )}>
              Tier {profile.tier}
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{profile.name || 'Unknown'}</h1>
            <div className="flex items-center gap-2 mt-1">
              {profile.globalRank && (
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  #{profile.globalRank.rank} Global
                </Badge>
              )}
              {profile.clubs?.map(c => (
                <Badge key={c.club.id} variant="outline" className="border-emerald-500/30 text-emerald-400">
                  {c.role === 'OWNER' && <Crown className="w-3 h-3 mr-1" />}
                  {c.club.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-slate-400 text-sm">{profile.bio}</p>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          <QuickStat 
            icon={<Trophy className="w-4 h-4" />}
            label="Championships"
            value={stats?.tournamentsWon || 0}
            color="yellow"
          />
          <QuickStat 
            icon={<Medal className="w-4 h-4" />}
            label="MVPs"
            value={stats?.mvpCount || 0}
            color="purple"
          />
          <QuickStat 
            icon={<Target className="w-4 h-4" />}
            label="Win Rate"
            value={`${winRate}%`}
            color="green"
          />
          <QuickStat 
            icon={<Zap className="w-4 h-4" />}
            label="Points"
            value={profile.points}
            color="cyan"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex">
          {[
            { id: 'stats', label: 'Stats', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'achievements', label: 'Badges', icon: <Award className="w-4 h-4" /> },
            { id: 'history', label: 'History', icon: <Calendar className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "text-cyan-400 border-b-2 border-cyan-400" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <StatsCard stats={stats} />
              <RatingCard rating={stats?.rating || 1000} />
              <StreakCard 
                current={stats?.currentWinStreak || 0}
                longest={stats?.longestWinStreak || 0}
              />
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {profile.achievements?.map(achievement => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
              {(!profile.achievements || profile.achievements.length === 0) && (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">No achievements yet</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="text-center py-8">
                <Gamepad2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <p className="text-slate-400">Match history coming soon</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Quick Stat Component
function QuickStat({ 
  icon, label, value, color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color: 'yellow' | 'purple' | 'green' | 'cyan';
}) {
  const colors = {
    yellow: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className={cn(
      "flex flex-col items-center p-3 rounded-xl border text-center",
      colors[color]
    )}>
      {icon}
      <span className="text-lg font-bold mt-1">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  );
}

// Stats Card
function StatsCard({ stats }: { stats?: PlayerStats }) {
  if (!stats) {
    return (
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="py-6 text-center">
          <p className="text-slate-400">No stats available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Tournament Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <StatItem label="Tournaments Played" value={stats.tournamentsPlayed} />
          <StatItem label="Championships" value={stats.tournamentsWon} highlight />
          <StatItem label="Runner-up" value={stats.tournamentsRunnerUp} />
          <StatItem label="Third Place" value={stats.tournamentsThirdPlace} />
          <StatItem label="Matches Won" value={stats.matchesWon} />
          <StatItem label="Matches Lost" value={stats.matchesLost} />
          <StatItem label="Total Matches" value={stats.matchesPlayed} />
          <StatItem label="MVP Awards" value={stats.mvpCount} highlight />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={cn(
        "font-semibold",
        highlight ? "text-cyan-400" : "text-white"
      )}>{value}</span>
    </div>
  );
}

// Rating Card
function RatingCard({ rating }: { rating: number }) {
  const getRank = (r: number) => {
    if (r >= 2000) return { name: 'Grandmaster', color: 'from-yellow-400 to-amber-500' };
    if (r >= 1800) return { name: 'Master', color: 'from-purple-400 to-pink-500' };
    if (r >= 1600) return { name: 'Diamond', color: 'from-cyan-400 to-blue-500' };
    if (r >= 1400) return { name: 'Platinum', color: 'from-emerald-400 to-teal-500' };
    if (r >= 1200) return { name: 'Gold', color: 'from-yellow-500 to-orange-500' };
    if (r >= 1000) return { name: 'Silver', color: 'from-slate-300 to-slate-500' };
    return { name: 'Bronze', color: 'from-amber-600 to-amber-800' };
  };

  const rank = getRank(rating);

  return (
    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
      <div className={cn("h-1 bg-gradient-to-r", rank.color)} />
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Skill Rating</p>
            <p className="text-3xl font-bold text-white">{Math.round(rating)}</p>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-xl bg-gradient-to-r text-white font-bold",
            rank.color
          )}>
            {rank.name}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Streak Card
function StreakCard({ current, longest }: { current: number; longest: number }) {
  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardContent className="pt-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <p className="text-slate-400 text-xs">Current Streak</p>
                <p className="text-2xl font-bold text-orange-400">{current}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Best Streak</p>
                <p className="text-2xl font-bold text-white">{longest}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Achievement Badge
function AchievementBadge({ achievement }: { achievement: Achievement }) {
  const categoryColors = {
    TOURNAMENT: 'border-yellow-500/30 bg-yellow-500/10',
    SKILL: 'border-cyan-500/30 bg-cyan-500/10',
    SOCIAL: 'border-purple-500/30 bg-purple-500/10',
    MILESTONE: 'border-emerald-500/30 bg-emerald-500/10',
    SPECIAL: 'border-pink-500/30 bg-pink-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border",
        categoryColors[achievement.achievement.category as keyof typeof categoryColors] || categoryColors.MILESTONE
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
        {achievement.achievement.icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-white">{achievement.achievement.name}</p>
        <p className="text-sm text-slate-400">{achievement.achievement.description}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-cyan-400">+{achievement.achievement.points} pts</p>
        <p className="text-xs text-slate-500">
          {new Date(achievement.earnedAt).toLocaleDateString('id-ID')}
        </p>
      </div>
    </motion.div>
  );
}

export default PlayerProfile;
