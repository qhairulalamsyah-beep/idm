import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/players/stats - Get player statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const phone = searchParams.get('phone');

    let user;
    
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
        include: {
          playerStats: true,
          globalRank: true,
          achievements: {
            include: {
              achievement: true,
            },
            orderBy: { earnedAt: 'desc' },
            take: 10,
          },
          teams: {
            include: {
              team: {
                include: {
                  tournament: {
                    select: { id: true, name: true, division: true, status: true },
                  },
                },
              },
            },
            take: 5,
          },
          clubs: {
            include: {
              club: {
                select: { id: true, name: true, logo: true },
              },
            },
          },
          mvpAwards: {
            take: 5,
          },
        },
      });
    } else if (phone) {
      user = await db.user.findUnique({
        where: { phone },
        include: {
          playerStats: true,
          globalRank: true,
          achievements: {
            include: {
              achievement: true,
            },
            orderBy: { earnedAt: 'desc' },
            take: 10,
          },
          teams: {
            include: {
              team: {
                include: {
                  tournament: {
                    select: { id: true, name: true, division: true, status: true },
                  },
                },
              },
            },
            take: 5,
          },
          clubs: {
            include: {
              club: {
                select: { id: true, name: true, logo: true },
              },
            },
          },
          mvpAwards: {
            take: 5,
          },
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'userId or phone required' },
        { status: 400 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      );
    }

    // Calculate additional stats
    const wins = user.playerStats?.matchesWon || 0;
    const losses = user.playerStats?.matchesLost || 0;
    const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        calculatedStats: {
          winRate,
          totalMatches: wins + losses,
          kdRatio: user.playerStats?.totalDeaths 
            ? (user.playerStats.totalKills / user.playerStats.totalDeaths).toFixed(2)
            : '-',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player stats' },
      { status: 500 }
    );
  }
}

// POST /api/players/stats - Create or update player stats
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      );
    }

    // Create player stats if not exists
    const stats = await db.playerStats.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error creating player stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create player stats' },
      { status: 500 }
    );
  }
}

// PATCH /api/players/stats - Update player stats
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      );
    }

    // Filter valid fields
    const validFields = [
      'tournamentsPlayed', 'tournamentsWon', 'tournamentsRunnerUp', 'tournamentsThirdPlace',
      'matchesPlayed', 'matchesWon', 'matchesLost', 'totalKills', 'totalDeaths',
      'mvpCount', 'currentWinStreak', 'longestWinStreak', 'totalPrizeMoney', 'rating'
    ];
    
    const data: Record<string, unknown> = {};
    for (const key of validFields) {
      if (updates[key] !== undefined) {
        data[key] = updates[key];
      }
    }

    const stats = await db.playerStats.update({
      where: { userId },
      data,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error updating player stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update player stats' },
      { status: 500 }
    );
  }
}
