import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Type for achievement category
type AchievementCategory = 'TOURNAMENT' | 'SKILL' | 'SOCIAL' | 'MILESTONE';

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS: {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: string;
  points: number;
}[] = [
  // Tournament achievements
  { code: 'FIRST_WIN', name: 'First Blood', description: 'Menang pertandingan pertama', icon: '🩸', category: 'TOURNAMENT', requirement: 'Win first match', points: 10 },
  { code: 'TOP_KING', name: 'Top King', description: 'Menjuarai 1 turnamen', icon: '👑', category: 'TOURNAMENT', requirement: 'Win 1 tournament', points: 50 },
  { code: 'DOMINATOR', name: 'Dominator', description: 'Menjuarai 5 turnamen', icon: '🏆', category: 'TOURNAMENT', requirement: 'Win 5 tournaments', points: 200 },
  { code: 'LEGEND', name: 'Legend', description: 'Menjuarai 10 turnamen', icon: '⭐', category: 'TOURNAMENT', requirement: 'Win 10 tournaments', points: 500 },
  
  // Streak achievements
  { code: 'UNBEATEN_3', name: 'Unbeaten', description: 'Menang 3 kali berturut-turut', icon: '🔥', category: 'SKILL', requirement: 'Win 3 matches in a row', points: 30 },
  { code: 'UNBEATEN_5', name: 'Unstoppable', description: 'Menang 5 kali berturut-turut', icon: '💥', category: 'SKILL', requirement: 'Win 5 matches in a row', points: 100 },
  { code: 'UNBEATEN_10', name: 'Godlike', description: 'Menang 10 kali berturut-turut', icon: '⚡', category: 'SKILL', requirement: 'Win 10 matches in a row', points: 300 },
  
  // MVP achievements
  { code: 'MVP_ONCE', name: 'Star Player', description: 'Mendapat MVP 1 kali', icon: '🌟', category: 'SKILL', requirement: 'Get 1 MVP award', points: 50 },
  { code: 'MVP_THREE', name: 'Triple Star', description: 'Mendapat MVP 3 kali', icon: '✨', category: 'SKILL', requirement: 'Get 3 MVP awards', points: 150 },
  { code: 'MVP_FIVE', name: 'Super Star', description: 'Mendapat MVP 5 kali', icon: '💫', category: 'SKILL', requirement: 'Get 5 MVP awards', points: 300 },
  
  // Social achievements
  { code: 'CLUB_LEADER', name: 'Ketua Club', description: 'Menjadi ketua sebuah club', icon: '👔', category: 'SOCIAL', requirement: 'Become a club owner', points: 20 },
  { code: 'TEAM_CAPTAIN', name: 'Captain', description: 'Menjadi kapten tim', icon: '🎯', category: 'SOCIAL', requirement: 'Become a team captain', points: 15 },
  
  // Milestone achievements
  { code: 'SEPUH', name: 'Sepuh', description: 'Bergabung lebih dari 1 tahun', icon: '👴', category: 'MILESTONE', requirement: 'Be a member for 1 year', points: 25 },
  { code: 'VETERAN', name: 'Veteran', description: 'Ikut 10 turnamen', icon: '🎖️', category: 'MILESTONE', requirement: 'Participate in 10 tournaments', points: 100 },
  { code: 'HARDCORE', name: 'Hardcore', description: 'Ikut 25 turnamen', icon: '🏅', category: 'MILESTONE', requirement: 'Participate in 25 tournaments', points: 250 },
];

// GET /api/players/achievements - Get user achievements or all achievements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const getAll = searchParams.get('all') === 'true';

    if (getAll) {
      // Return all achievement definitions
      const achievements = await db.achievement.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { points: 'asc' }],
      });
      
      // If empty, seed with definitions
      if (achievements.length === 0) {
        await db.achievement.createMany({
          data: ACHIEVEMENT_DEFINITIONS,
        });
        const newAchievements = await db.achievement.findMany({
          where: { isActive: true },
          orderBy: [{ category: 'asc' }, { points: 'asc' }],
        });
        return NextResponse.json({ success: true, data: newAchievements });
      }

      return NextResponse.json({ success: true, data: achievements });
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId or all=true required' },
        { status: 400 }
      );
    }

    // Get user's achievements
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { earnedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: userAchievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}

// POST /api/players/achievements - Award achievement to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, achievementCode } = body;

    if (!userId || !achievementCode) {
      return NextResponse.json(
        { success: false, error: 'userId and achievementCode required' },
        { status: 400 }
      );
    }

    // Find achievement
    const achievement = await db.achievement.findUnique({
      where: { code: achievementCode },
    });

    if (!achievement) {
      return NextResponse.json(
        { success: false, error: 'Achievement not found' },
        { status: 404 }
      );
    }

    // Check if already earned
    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Achievement already earned',
      });
    }

    // Award achievement
    const userAchievement = await db.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      },
      include: { achievement: true },
    });

    // Add points to user
    if (achievement.points > 0) {
      await db.user.update({
        where: { id: userId },
        data: { points: { increment: achievement.points } },
      });
    }

    return NextResponse.json({
      success: true,
      data: userAchievement,
      message: `Achievement "${achievement.name}" earned!`,
    });
  } catch (error) {
    console.error('Error awarding achievement:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to award achievement' },
      { status: 500 }
    );
  }
}

// Check and auto-award achievements based on stats
export async function checkAndAwardAchievements(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        playerStats: true,
        clubs: { where: { role: 'OWNER' } },
        teams: { where: { isCaptain: true } },
      },
    });

    if (!user || !user.playerStats) return [];

    const stats = user.playerStats;
    const earnedAchievements: string[] = [];

    // Check tournament wins
    if (stats.tournamentsWon >= 1) {
      await awardIfNotEarned(userId, 'TOP_KING');
      earnedAchievements.push('TOP_KING');
    }
    if (stats.tournamentsWon >= 5) {
      await awardIfNotEarned(userId, 'DOMINATOR');
      earnedAchievements.push('DOMINATOR');
    }
    if (stats.tournamentsWon >= 10) {
      await awardIfNotEarned(userId, 'LEGEND');
      earnedAchievements.push('LEGEND');
    }

    // Check streaks
    if (stats.longestWinStreak >= 3) {
      await awardIfNotEarned(userId, 'UNBEATEN_3');
      earnedAchievements.push('UNBEATEN_3');
    }
    if (stats.longestWinStreak >= 5) {
      await awardIfNotEarned(userId, 'UNBEATEN_5');
      earnedAchievements.push('UNBEATEN_5');
    }
    if (stats.longestWinStreak >= 10) {
      await awardIfNotEarned(userId, 'UNBEATEN_10');
      earnedAchievements.push('UNBEATEN_10');
    }

    // Check MVP
    if (stats.mvpCount >= 1) {
      await awardIfNotEarned(userId, 'MVP_ONCE');
      earnedAchievements.push('MVP_ONCE');
    }
    if (stats.mvpCount >= 3) {
      await awardIfNotEarned(userId, 'MVP_THREE');
      earnedAchievements.push('MVP_THREE');
    }
    if (stats.mvpCount >= 5) {
      await awardIfNotEarned(userId, 'MVP_FIVE');
      earnedAchievements.push('MVP_FIVE');
    }

    // Check milestones
    if (stats.tournamentsPlayed >= 10) {
      await awardIfNotEarned(userId, 'VETERAN');
      earnedAchievements.push('VETERAN');
    }
    if (stats.tournamentsPlayed >= 25) {
      await awardIfNotEarned(userId, 'HARDCORE');
      earnedAchievements.push('HARDCORE');
    }

    // Check social
    if (user.clubs.length > 0) {
      await awardIfNotEarned(userId, 'CLUB_LEADER');
      earnedAchievements.push('CLUB_LEADER');
    }
    if (user.teams.length > 0) {
      await awardIfNotEarned(userId, 'TEAM_CAPTAIN');
      earnedAchievements.push('TEAM_CAPTAIN');
    }

    // Check tenure (1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (user.createdAt <= oneYearAgo) {
      await awardIfNotEarned(userId, 'SEPUH');
      earnedAchievements.push('SEPUH');
    }

    return earnedAchievements;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
}

// Helper to award achievement if not already earned
async function awardIfNotEarned(userId: string, code: string) {
  try {
    const achievement = await db.achievement.findUnique({
      where: { code },
    });

    if (!achievement) return;

    const existing = await db.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id },
      },
    });

    if (!existing) {
      await db.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });

      if (achievement.points > 0) {
        await db.user.update({
          where: { id: userId },
          data: { points: { increment: achievement.points } },
        });
      }
    }
  } catch (error) {
    console.error(`Error awarding ${code}:`, error);
  }
}
