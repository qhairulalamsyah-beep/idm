import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/rankings - Get global rankings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'players'; // 'players' or 'clubs'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (type === 'clubs') {
      const clubs = await db.club.findMany({
        take: limit,
        orderBy: { totalPoints: 'desc' },
        include: {
          _count: { select: { teams: true, members: true } },
        },
      });

      const rankings = clubs.map((club, index) => ({
        rank: index + 1,
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalPoints: club.totalPoints,
        teams: club._count.teams,
        members: club._count.members,
      }));

      return NextResponse.json({
        success: true,
        data: rankings,
      });
    }

    // Players ranking
    const users = await db.user.findMany({
      take: limit,
      orderBy: { points: 'desc' },
      where: { role: 'PARTICIPANT' },
    });

    const rankings = users.map((user, index) => ({
      rank: index + 1,
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      tier: user.tier,
      points: user.points,
    }));

    return NextResponse.json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
